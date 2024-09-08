import boto3
import json

dynamo_source = boto3.resource("dynamodb")
thetable = dynamo_source.Table("lotion-30161505")

def delete_item(email, note_id):
    return thetable.delete_item(
        Key = {
        "email": email,
        "id": note_id
        }
    )

def lambda_handler(event, context):
    body = json.loads(event["body"])
    note_id = body["id"]
    email = body["email"]

    try: 
        delete_item(email, note_id)
        return{
            "statusCode": 201,
            "body": json.dumps({
                    "message": "success"
            })
        }
    except Exception as e:
        print(e)
        return{
            "statusCode": 500,
                "body": json.dumps({
                    "message": str(e)
                })
        }