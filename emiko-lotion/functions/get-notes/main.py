import json
import boto3
from boto3.dynamodb.conditions import Key

dynamo_Source = boto3.resource("dynamodb")
thetable = dynamo_Source.Table("lotion-30161505")

def handler(event, context):
    body = json.loads(event["body"])
    email = body.get("email")

    try:
        # Query the DynamoDB table using the provided email
        res = thetable.query(KeyConditionExpression=Key("email").eq(email))

        # Return the matching items
        return {
            "statusCode": 200,
            "body": json.dumps(
                res["Items"]  
            )
        }
    except Exception as e:
        print(f"exception: {e}")
        return {
            "statusCode": 500,  
            "body": json.dumps(
                {
                    "message": str(e)  
                }
            )
        }
