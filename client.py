import requests
import pprint

headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 04fd8c7e-9ec4-4766-9496-88c35ca3b52c',
}

tables = {
    "GlobalFFE": "native-table-ppOg3XcBCt4FF3uBTB7M",
    "OrgFFE": "native-table-HHiIkZIBAWcR71O4FnHq",
}

addGlobalFFE = {
    "kind": "add-row-to-table",
    "tableName": tables["GlobalFFE"],
    "columnValues": {
        "Name": "Galinha Side Chair",
        "L28Mr": "https://www.thecontractchair.co.uk/product/galinha-side-chair"
    }
}

addOrgFFE = {
    "kind": "add-row-to-table",
    "tableName": tables["OrgFFE"],
    "columnValues": {
        "Name": "Galinha Side Chair", #name
        "Ih8oG": "https://www.thecontractchair.co.uk/media/store/product/galinha-side-chair/New_Project.jpg", #main image
        "sxVR3": "https://www.thecontractchair.co.uk/media/store/product/galinha-side-chair/New_Project.jpg", #main image url
        "LOn14": [ #supporting images
            "https://www.thecontractchair.co.uk/media/store/product/galinha-side-chair/Joanne_M954_03.jpg",
            "https://www.thecontractchair.co.uk/media/store/product/galinha-side-chair/0025785_0.jpeg"
        ],
        "zqMEv": [ #supporting image urls
            "https://www.thecontractchair.co.uk/media/store/product/galinha-side-chair/Joanne_M954_03.jpg",
            "https://www.thecontractchair.co.uk/media/store/product/galinha-side-chair/0025785_0.jpeg"
        ],
        "EDelh": "ABDC123456", #sku
        "16TCS": "#dc143c", #colour
        "6FY82": "100.00", #cost
        "L28Mr": "https://www.thecontractchair.co.uk/product/galinha-side-chair", #webpage

        "RWJXT": "4efasZVEREGNxWVh.lsg5A", #organisation id
        "tnIaQ": "oeHU9zrGQU2qLzrRjGc33w", #FFE category id
        "6RcDK": "4V7Wyvx6TaO-R4KaMeeOvw" #global FFE id
    }
}

def query(tableName):
    global headers
    endpoint = "https://api.glideapp.io/api/function/queryTables"
    data = {
        "appID": "JTibogkVNJdGSwrBH675",
        "queries": [
            {
                "tableName": tableName
            }
        ]
    }
    
    return requests.post(endpoint, headers=headers, json=data)

def mutate(tableName, mutations):
    global headers
    endpoint = "https://api.glideapp.io/api/function/mutateTables"
    data = {
        "appID": "JTibogkVNJdGSwrBH675",
        "mutations": mutations
    }

    return requests.post(endpoint, headers=headers, json=data)

def findGlobalFFE(response, webpage):
    for d in response[0]["rows"]:
        if "webpage" in d and d["webpage"] == webpage:
            return d["$rowId"]
    return None

response = query(tables["GlobalFFE"])
response = response.json()
exists_globally = findGlobalFFE(response, "https://www.thecontractchair.co.uk/product/galinha-side-chair")


# if response.status_code == 200:
#     pprint.pprint(response.json())
# else:
#     pprint.pprint(f"Error: {response.status_code}, {response.text}")
