from pymongo import MongoClient
from pymongo.server_api import ServerApi
from .config import MONGO_URI
import logging


def connect_to_mongo():
    """
    Establish a connection to the MongoDB server and return the client object.
    """
    try:
        print(MONGO_URI)
        client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
        client.admin.command("ping")
        logging.info("Successfully connected to MongoDB!")
        return client
    except Exception as e:
        logging.error(f"Error connecting to MongoDB: {e}")
        raise


def get_database(client, db_name):
    """
    Retrieve the specified database from the MongoDB client.

    :param client: MongoClient object
    :param db_name: Name of the database to retrieve
    :return: Database object
    """
    return client[db_name]


# Establish MongoDB connection and retrieve the necessary collections
mongo_client = connect_to_mongo()
database = get_database(mongo_client, "grab-engineering-project")
place_latlong = database["Place_LatLong_API"]
data_summary = database["data_summary"]
future_summary = database["Predict_Future_Data"]


def find_one_document(collection, query, projection=None):
    """
    Find a single document in a MongoDB collection.

    :param collection: MongoDB collection object
    :param query: Query dictionary to filter the documents
    :param projection: Projection dictionary to specify the fields to include or exclude
    :return: A single document or None
    """
    return collection.find_one(query, projection)


def find_documents(collection, query=None, projection=None):
    """
    Find multiple documents in a MongoDB collection.

    :param collection: MongoDB collection object
    :param query: Query dictionary to filter the documents (default is None, which means no filter)
    :param projection: Projection dictionary to specify the fields to include or exclude (default is None)
    :return: A list of documents
    """
    return list(collection.find(query or {}, projection))
