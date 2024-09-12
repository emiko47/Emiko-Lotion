import json
import boto3

# Initialize DynamoDB resource and target table
dynamo_Source = boto3.resource("dynamodb")
table = dynamo_Source.Table("lotion-30161505")

def handler(event, context):
    # Parse the body of the incoming event
    body = json.loads(event["body"])

    # Extract email, currnote_id (sort key), notebody, title, and when from the body
    email = body.get("email")
    currnote_id = body.get("currnote_id")
    new_notebody = body.get("notebody")
    new_title = body.get("title")
    new_when = body.get("when")

    # Check if required fields are present
    if not email or not currnote_id or new_notebody is None:
        return {
            "statusCode": 400,
            "body": json.dumps({
                "message": "Missing required fields: 'email', 'currnote_id', or 'notebody'"
            })
        }

    try:
        # Query the table to check if an item with the given email and currnote_id exists
        response = table.get_item(
            Key={
                'email': email,      # Partition key
                'id': currnote_id    # Sort key
            }
        )

        # If an item exists, update the body, title, and when fields with the new values
        if 'Item' in response:
            table.update_item(
                Key={
                    'email': email,      # Partition key
                    'id': currnote_id    # Sort key
                },
                UpdateExpression="SET body = :new_body, title = :new_title, #w = :new_when",
                ExpressionAttributeValues={
                    ':new_body': new_notebody,
                    ':new_title': new_title,
                    ':new_when': new_when
                },
                ExpressionAttributeNames={
                    '#w': 'when'  # Using an alias for 'when' as it is a reserved keyword in DynamoDB
                }
            )

            return {
                "statusCode": 200,
                "body": json.dumps({
                    "message": "Note updated successfully"
                })
            }
        else:
            # If no matching item is found, create a new entry with an empty body or the new body
            table.put_item(
                Item={
                    'email': email,          # Partition key
                    'id': currnote_id,       # Sort key
                    'body': new_notebody,              # Initialize with an empty body
                    'title': new_title,      # Set new title
                    'when': new_when         # Set new when
                }
            )
            return {
                "statusCode": 201,
                "body": json.dumps({
                    "message": "New note created with an empty body, title, and when"
                })
            }
    
    except Exception as e:
        # Handle any errors that occur during the operation
        print(f"Exception: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": str(e)
            })
        }
