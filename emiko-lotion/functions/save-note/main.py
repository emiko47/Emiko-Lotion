import json 
import boto3

dynamo_Source = boto3.resource("dynamodb")
table = dynamo_Source.Table("lotion-30161505")

def lambda_handler(event, context):
    body = json.loads(event["body"])
    try: 
        table.put_item(Item = body)
        return {
            "statusCode": 201,
                "body":json.dumps({
                     "message": "success"
                })
        }
    except Exception as e:
        print(f"exception: {e}")
        return {
            "statusCode": 500,
                "body": json.dumps({
                    "message":str(e)
            })
        }