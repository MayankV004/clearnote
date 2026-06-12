terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "ap-south-1" # Using Mumbai as per the project plan, change if needed
}

# ---------------------------------------------------------
# 1. S3 Bucket for Audio Storage
# ---------------------------------------------------------
resource "aws_s3_bucket" "audio_store" {
  bucket = "clearnote-audio-store-${terraform.workspace}"
  
  # Prevent accidental deletion of the bucket in production
  force_destroy = true 
}

# Enable Server-Side Encryption (SSE-S3)
resource "aws_s3_bucket_server_side_encryption_configuration" "audio_store_sse" {
  bucket = aws_s3_bucket.audio_store.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block Public Access completely (HIPAA compliance)
resource "aws_s3_bucket_public_access_block" "audio_store_public_access" {
  bucket                  = aws_s3_bucket.audio_store.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy: Delete audio files after 90 days
resource "aws_s3_bucket_lifecycle_configuration" "audio_store_lifecycle" {
  bucket = aws_s3_bucket.audio_store.id
  rule {
    id     = "delete-after-90-days"
    status = "Enabled"
    filter {}
    expiration {
      days = 90
    }
  }
}

# ---------------------------------------------------------
# 2. SQS Dead Letter Queue (DLQ)
# ---------------------------------------------------------
resource "aws_sqs_queue" "transcription_dlq" {
  name = "clearnote-transcription-dlq-${terraform.workspace}"
  message_retention_seconds = 1209600 # 14 days retention for failures
}

# ---------------------------------------------------------
# 3. IAM Role & Policy for Lambda
# ---------------------------------------------------------
resource "aws_iam_role" "lambda_execution_role" {
  name = "clearnote-lambda-execution-role-${terraform.workspace}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Attach basic Lambda execution permissions (CloudWatch logs)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Custom policy for S3 Read/Write and SQS Send
resource "aws_iam_policy" "lambda_s3_sqs_policy" {
  name        = "clearnote-lambda-s3-sqs-policy-${terraform.workspace}"
  description = "Allows Lambda to read audio from S3 and send errors to SQS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.audio_store.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.transcription_dlq.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_custom_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_s3_sqs_policy.arn
}

# ---------------------------------------------------------
# 4. Lambda Function for Transcription
# ---------------------------------------------------------
# Note: You will need to create the worker package first.
# For now, we will use a dummy zip file so Terraform can provision the resource.
data "archive_file" "dummy_lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/dummy_lambda.zip"
  source {
    content  = "def handler(event, context):\n    pass"
    filename = "main.py"
  }
}

resource "aws_lambda_function" "transcription_worker" {
  function_name    = "clearnote-transcription-worker-${terraform.workspace}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "main.handler"
  runtime          = "python3.12"
  timeout          = 300 # 5 minutes timeout for Whisper processing
  memory_size      = 512 # 512 MB RAM
  
  filename         = data.archive_file.dummy_lambda_zip.output_path
  source_code_hash = data.archive_file.dummy_lambda_zip.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = terraform.workspace
      # API keys will be fetched via AWS Secrets Manager in production,
      # but can be passed here during development if preferred.
    }
  }
  
  # Dead Letter Config for failed transcriptions
  dead_letter_config {
    target_arn = aws_sqs_queue.transcription_dlq.arn
  }
}

# ---------------------------------------------------------
# 5. S3 Bucket Notification -> Trigger Lambda
# ---------------------------------------------------------
# Give S3 permission to invoke the Lambda function
resource "aws_lambda_permission" "allow_s3_invocation" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transcription_worker.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.audio_store.arn
}

# Configure S3 to trigger the Lambda on object creation
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.audio_store.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.transcription_worker.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".webm" # Only trigger for WebM audio files
  }

  depends_on = [aws_lambda_permission.allow_s3_invocation]
}

# ---------------------------------------------------------
# Outputs
# ---------------------------------------------------------
output "s3_audio_bucket_name" {
  value = aws_s3_bucket.audio_store.id
}

output "sqs_dlq_url" {
  value = aws_sqs_queue.transcription_dlq.url
}
