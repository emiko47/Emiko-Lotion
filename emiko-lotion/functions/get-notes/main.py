import json
import boto3
from boto3.dynamodb.conditions import Key

dynamo_Source = boto3.resource("dynamodb")
thetable = dynamo_Source.Table("lotion-30161505")

def handler(event, context):
    email = event["queryStringParameters"]["email"]

    try:
        res = thetable.query(KeyConditionExpression = Key("email").eq(email))
        return{
            "statusCode": 201,
            "body": json.dumps(
                res["items"]
            )
        }
    except Exception as e:
        print(f"exception: {e}")
        return{
            "StatusCode": 500,
            "body": json.dumps(
            {
                "message:": str(e)
            })
        }