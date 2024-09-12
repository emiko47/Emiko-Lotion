terraform{
    required_providers{
        aws = {
            version = ">= 4.0.0"
            source = "hashicorp/aws"
        }
    }
}

provider "aws"{
    region = "ca-central-1"
} 


#save a DynamoDB table
resource "aws_dynamodb_table" "lotion-notes-table" {
    name = "lotion-30161505"
    billing_mode = "PROVISIONED"
    hash_key = "email" # hash key ~ partition key
    range_key = "id" # range key ~ sort key
    
    # up to 8KB read per second
    read_capacity = 1

    # up to 1KB per second
    write_capacity = 1

    attribute{
        name = "email"
        type = "S"
    }
    attribute {
        name = "id"
        type = "S"
    }

    
  
}

#make use of the locals block to define constants for the lambda function
locals {
    func_name_save = "save-note-30161506"
    func_name_get = "get_note-30161505"
    func_name_delete = "delete-note-30161505"

    handler_name = "main.handler"

    artifact_get = "get-notes.zip"
    artifact_save = "save-note.zip"
    artifact_delete = "delete-note.zip"

    role_name = "i-am-for-lambda-function"
    policy_name = "lambda-function-logging-policy"
  
}


#create a i-am-role for the lambda function
resource "aws_iam_role" "role" {
    name = local.role_name
    assume_role_policy = <<EOF
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Effect": "Allow",
                "Sid": ""
            }
        ]
    }
    EOF
}

#create a i-am-policy for the lambda function
resource "aws_iam_policy" "logs" {
    name        = local.policy_name
    description = "A policy to allow lambda functions to write logs"
    policy      = <<EOF
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "dynamodb:DeleteItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query"
                ],
                "Resource": [
                    "arn:aws:logs:*:*:*",
                    "${aws_dynamodb_table.lotion-notes-table.arn}"
                ],
                "Effect": "Allow"
            }
        ]
    }
    EOF
}


#attach the i-am-policy to the i-am-role function role
resource "aws_iam_role_policy_attachment" "role_logs" {
    role       = aws_iam_role.role.name
    policy_arn = aws_iam_policy.logs.arn
}

data "archive_file" "get-data" {
    type        = "zip"
    source_file  = "../functions/get-notes/main.py"
    output_path = local.artifact_get
}

#create a lambda function for get-note
resource "aws_lambda_function" "get_note"{
    role = aws_iam_role.role.arn
    function_name = local.func_name_get
    handler = local.handler_name
    filename = local.artifact_get
    source_code_hash = data.archive_file.get-data.output_base64sha256

    environment {
    variables = {
      "ACCESS_CONTROL_ALLOW_ORIGIN" = "*"
      "ACCESS_CONTROL_ALLOW_METHODS" = "GET,POST,PUT,DELETE"
      "ACCESS_CONTROL_ALLOW_HEADERS" = "*"
        }
    }

    runtime = "python3.9"
}

data "archive_file" "save-data" {
    type        = "zip"
    source_file  = "../functions/save-note/main.py"
    output_path = local.artifact_save
}

#create a lambda function for save-note
resource "aws_lambda_function" "save_note"{
    role = aws_iam_role.role.arn
    function_name = local.func_name_save
    handler = local.handler_name
    filename = local.artifact_save

    source_code_hash = data.archive_file.save-data.output_base64sha256

    runtime = "python3.9"

}


data "archive_file" "delete-data" {
    type        = "zip"
    source_file  = "../functions/delete-note/main.py"
    output_path = local.artifact_delete
}



#create a lambda function for delete-note
resource "aws_lambda_function" "delete_note"{
    role = aws_iam_role.role.arn
    function_name = local.func_name_delete
    handler = local.handler_name
    filename = local.artifact_delete
    source_code_hash = data.archive_file.delete-data.output_base64sha256

    runtime = "python3.9"

}




resource "aws_lambda_function_url" "delete-url" {
    function_name = aws_lambda_function.delete_note.function_name
    authorization_type = "NONE"

    cors{
        allow_credentials = true
        allow_origins = ["*"]
        allow_methods = ["GET", "POST", "DELETE"]
        allow_headers = ["*"]
        expose_headers = ["keep-alive", "date"]
    }

  
}

resource "aws_lambda_function_url" "save-url" {
    function_name = aws_lambda_function.save_note.function_name
    authorization_type = "NONE"

   cors{
        allow_credentials = true
        allow_origins = ["*"]
        allow_methods = ["GET", "POST", "DELETE"]
        allow_headers = ["*"]
        expose_headers = ["keep-alive", "date"]
    }
}
  

resource "aws_lambda_function_url" "get-url" {
    function_name = aws_lambda_function.get_note.function_name
    authorization_type = "NONE"

   cors{
        allow_credentials = true
        allow_origins = ["*"]
        allow_methods = ["GET", "POST", "DELETE"]
        allow_headers = ["*"]
        expose_headers = ["keep-alive", "date"]
    }

}

output "save-url" {
    value = aws_lambda_function_url.save-url.function_url
}

output "get-url" {
    value = aws_lambda_function_url.get-url.function_url
}

output "delete-url" {
    value = aws_lambda_function_url.delete-url.function_url
}