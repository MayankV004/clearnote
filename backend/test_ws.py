import asyncio
import websockets

async def test_ws():
    uri = "ws://localhost:8000/consultations/bae59e96-1703-41f3-ae1c-0a42bacf055b/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await websocket.send(b"fake audio data")
            print("Sent data!")
            # Gracefully close to trigger WebSocketDisconnect in FastAPI
            await websocket.close()
            print("Closed!")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_ws())
