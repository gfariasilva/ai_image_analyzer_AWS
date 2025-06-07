import boto3
import json
import mysql.connector
import os
from datetime import datetime

def get_db_connection():
    try:
        return mysql.connector.connect(
            user=os.environ['user'],
            password=os.environ['password'],
            host=os.environ['host'],
            database=os.environ['database']
        )
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
        return None

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    rekognition = boto3.client('rekognition')
    dynamodb = boto3.resource('dynamodb', endpoint_url="https://dynamodb.us-east-1.amazonaws.com")
    sns = boto3.client('sns')

    metadata_table = dynamodb.Table('ImageMetadata')
    
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    response = rekognition.detect_labels(
        Image={'S3Object': {'Bucket': bucket, 'Name': key}},
        MinConfidence=90
    )
    
    has_person = any(label['Name'] == 'Person' for label in response['Labels'])
    
    try:
        response = metadata_table.put_item(
            Item={
                'imageId': key,
                'processedAt': datetime.now().isoformat(),
                'hasPerson': has_person,
                'labels': [label['Name'] for label in response['Labels']]
            }
        )
        print("DynamoDB put_item response:", response)
    except Exception as e:
        print(f"DynamoDB write failed: {str(e)}")
        raise
    
    try:
        cnx = get_db_connection()
        if not cnx:
            print('conexao falhou')

        cursor = cnx.cursor()

        cursor.execute('SHOW TABLES LIKE "results"')
        if not cursor.fetchone():
            cursor.execute("""
                CREATE TABLE results (
                    imageId VARCHAR(255) PRIMARY KEY,
                    hasPerson BOOLEAN,
                    processedAt TIMESTAMP
                );
            """)
            cnx.commit()

        cursor.execute(f"INSERT INTO results (imageId, hasPerson, processedAt) VALUES ({key}, {has_person}, NOW())")
        cnx.commit()
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'cnx' in locals():
            cnx.close()

    message = {
        'image': key,
        'status': 'processed',
        'has_person': has_person
    }

    response = sns.publish(
        TopicArn='arn:aws:sns:us-east-1:956874946376:ap-topic',
        Message=json.dumps(message),
        Subject='Imagem processada com sucesso!'
    )
    
    return {'statusCode': 200, 'result': has_person}