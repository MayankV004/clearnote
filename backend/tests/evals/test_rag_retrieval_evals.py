"""
test_rag_retrieval_evals.py

Retrieval evaluation benchmark for ClearNote's clinical RAG pipeline.
Measures Precision@3, Recall@3, and Mean Reciprocal Rank (MRR) over the
manually labelled query-to-guideline dataset in `rag_golden_dataset.py`,
exercising the real `RAGService` chunker, Nomic query/document formatting,
FastEmbed (`nomic-ai/nomic-embed-text-v1.5`) embeddings, and cosine-distance
top-3 ranking.
"""

import asyncio
import math
import pytest
from sqlalchemy.future import select

from app.models.guideline_chunk import GuidelineChunk
from app.services.rag_service import RAGService
from tests.evals.rag_golden_dataset import GUIDELINE_CORPUS, RETRIEVAL_EVAL_QUERIES


def cosine_distance(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine distance (1 - cosine_similarity), matching pgvector `<=>`."""
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 1.0
    return 1.0 - (dot / (norm_a * norm_b))


def deduplicate_ranked_ids(doc_ids: list[str]) -> list[str]:
    """Preserve rank order while keeping the first occurrence of each doc_id."""
    seen: set[str] = set()
    ordered: list[str] = []
    for doc_id in doc_ids:
        if doc_id not in seen:
            seen.add(doc_id)
            ordered.append(doc_id)
    return ordered


def precision_at_k(retrieved_ids: list[str], relevant_ids: set[str], k: int = 3) -> float:
    """Fraction of top-k retrieved items that are relevant."""
    if k <= 0:
        return 0.0
    top_k = retrieved_ids[:k]
    hits = sum(1 for doc_id in top_k if doc_id in relevant_ids)
    return hits / k


def recall_at_k(retrieved_ids: list[str], relevant_ids: set[str], k: int = 3) -> float:
    """Fraction of all relevant items retrieved in top-k."""
    if not relevant_ids:
        return 1.0
    top_k = set(retrieved_ids[:k])
    return len(top_k & relevant_ids) / len(relevant_ids)


def reciprocal_rank(retrieved_ids: list[str], relevant_ids: set[str]) -> float:
    """1 / rank (1-indexed) of the first relevant item, or 0.0 if absent."""
    for idx, doc_id in enumerate(retrieved_ids, start=1):
        if doc_id in relevant_ids:
            return 1.0 / idx
    return 0.0


async def evaluate_retrieval(
    service: RAGService,
    db_session=None,
    k: int = 3,
) -> dict:
    """
    Chunk and embed `GUIDELINE_CORPUS` with `RAGService`, rank against each
    labelled query in `RETRIEVAL_EVAL_QUERIES` by cosine distance, and return
    aggregate Precision@k, Recall@k, MRR, and per-query diagnostics.
    """
    splitter = service.get_text_splitter()
    indexed_chunks: list[tuple[str, list[float]]] = []

    for doc in GUIDELINE_CORPUS:
        for chunk_text in splitter.split_text(doc["content"]):
            emb = await service.get_embedding(service.format_document_text(chunk_text))
            assert any(v != 0.0 for v in emb), f"Zero-vector embedding returned for {doc['doc_id']}"
            indexed_chunks.append((doc["doc_id"], emb))
            if db_session is not None:
                db_session.add(
                    GuidelineChunk(
                        source=f"{doc['source']} [{doc['doc_id']}]",
                        page=doc["page"],
                        content=chunk_text,
                        embedding=emb,
                    )
                )

    if db_session is not None:
        await db_session.commit()
        persisted = (await db_session.scalars(select(GuidelineChunk))).all()
        assert len(persisted) == len(indexed_chunks)

    per_query: list[dict] = []
    for case in RETRIEVAL_EVAL_QUERIES:
        query_text = service.build_interaction_query(
            case["drug_a"], case["drug_b"], case["diag_context"]
        )
        query_emb = await service.get_embedding(query_text)
        assert any(v != 0.0 for v in query_emb), f"Zero-vector embedding returned for {case['query_id']}"

        scored = sorted(
            (
                (cosine_distance(query_emb, doc_emb), doc_id)
                for doc_id, doc_emb in indexed_chunks
            ),
            key=lambda item: item[0],
        )
        ranked_doc_ids = deduplicate_ranked_ids([doc_id for _, doc_id in scored])
        relevant = set(case["relevant_doc_ids"])

        p_k = precision_at_k(ranked_doc_ids, relevant, k=k)
        r_k = recall_at_k(ranked_doc_ids, relevant, k=k)
        rr = reciprocal_rank(ranked_doc_ids, relevant)

        per_query.append(
            {
                "query_id": case["query_id"],
                "top_k": ranked_doc_ids[:k],
                "expected": case["relevant_doc_ids"],
                "precision_at_k": p_k,
                "recall_at_k": r_k,
                "reciprocal_rank": rr,
            }
        )

    n = len(per_query)
    return {
        "num_docs": len(GUIDELINE_CORPUS),
        "num_chunks": len(indexed_chunks),
        "num_queries": n,
        "k": k,
        "precision_at_k": sum(q["precision_at_k"] for q in per_query) / n,
        "recall_at_k": sum(q["recall_at_k"] for q in per_query) / n,
        "mrr": sum(q["reciprocal_rank"] for q in per_query) / n,
        "per_query": per_query,
    }


class TestRAGRetrievalMetrics:
    """Unit tests for IR metric helpers and RAG retrieval quality gates."""

    def test_precision_recall_mrr_calculations(self):
        ranked = ["DOC-A", "DOC-B", "DOC-C", "DOC-D"]
        relevant = {"DOC-B", "DOC-D"}

        assert precision_at_k(ranked, relevant, k=3) == pytest.approx(1 / 3)
        assert recall_at_k(ranked, relevant, k=3) == pytest.approx(0.5)
        assert reciprocal_rank(ranked, relevant) == pytest.approx(0.5)

        assert precision_at_k(["DOC-X", "DOC-Y", "DOC-Z"], {"DOC-A"}, k=3) == 0.0
        assert recall_at_k(["DOC-X", "DOC-Y", "DOC-Z"], {"DOC-A"}, k=3) == 0.0
        assert reciprocal_rank(["DOC-X", "DOC-Y", "DOC-Z"], {"DOC-A"}) == 0.0

    @pytest.mark.asyncio
    async def test_rag_retrieval_precision_recall_mrr(self, db_session):
        """
        Evaluate ClearNote's real FastEmbed (`nomic-embed-text-v1.5`) retrieval
        across 12 manually labelled clinical queries and 18 guideline documents.

        Note: With 1 ground-truth document per query and k=3, the theoretical
        ceiling for Precision@3 is 1/3 (~0.3333).
        """
        service = RAGService()
        metrics = await evaluate_retrieval(service, db_session=db_session, k=3)

        assert metrics["recall_at_k"] >= 0.90, (
            f"Recall@3 {metrics['recall_at_k']:.4f} < 0.90; details={metrics['per_query']}"
        )
        assert metrics["precision_at_k"] >= 0.30, (
            f"Precision@3 {metrics['precision_at_k']:.4f} < 0.30; details={metrics['per_query']}"
        )
        assert metrics["mrr"] >= 0.80, (
            f"MRR {metrics['mrr']:.4f} < 0.80; details={metrics['per_query']}"
        )


if __name__ == "__main__":
    summary = asyncio.run(evaluate_retrieval(RAGService(), k=3))
    print(
        f"RAG Retrieval Eval ({summary['num_queries']} queries, "
        f"{summary['num_chunks']} chunks from {summary['num_docs']} docs):"
    )
    print(
        f"  Precision@{summary['k']}: {summary['precision_at_k']:.4f} | "
        f"Recall@{summary['k']}: {summary['recall_at_k']:.4f} | "
        f"MRR: {summary['mrr']:.4f}"
    )
    for row in summary["per_query"]:
        print(
            f"  {row['query_id']}: top3={row['top_k']} expected={row['expected']} "
            f"P@3={row['precision_at_k']:.3f} R@3={row['recall_at_k']:.1f} RR={row['reciprocal_rank']:.3f}"
        )
