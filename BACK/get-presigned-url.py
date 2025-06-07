import boto3
from uuid import uuid4
import json

def lambda_handler(event, context):
    s3 = boto3.client('s3')

    body = json.loads(event['body'])
    content_type = body.get('contentType', 'image/jpeg')

    key = f'{str(uuid4())}.jpg'

    url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'ap-images-bucket',
            'Key': key,
            'ContentType': content_type
        },
        ExpiresIn=300
    )

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'url': url,
            'imageId': key
        })
    }
