import boto3
import json
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('ImageMetadata')
    
    try:
        body = json.loads(event['body'])
        image_id = body.get('imageId', '')
        
        if not image_id:
            raise ValueError("Missing imageId in request")
            
        response = table.query(KeyConditionExpression=Key('imageId').eq(image_id))
        
        if not response.get('Items'):
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'status': 'error',
                    'message': 'Image not found',
                    'imageId': image_id
                })
            }
        
        item = response['Items'][0]
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'imageId': image_id,
                'has_person': item.get('hasPerson', False),
                'labels': item.get('labels', []),
                'type': item.get('type', 'image/jpeg'),
                'status': 'success'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'status': 'error',
                'message': str(e),
                'imageId': body.get('imageId', 'unknown') if 'body' in locals() else 'unknown'
            })
        }