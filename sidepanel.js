//////////////////////////////////////////////////////////////////////////////

//Show success / error on submission before resetting the clipper

//Add loading spinner

//////////////////////////////////////////////////////////////////////////////

let currentUrl = "";
let uid = "";
let orgId = "";

let ffe_form_data = {
    main_image: "",
    supporting_images: []
}

cache = {
    "tables": {
        "native-table-qQtBfW3I3zbQYJd4b3oF": null, // user table
        "native-table-VFCp81n4o1CXLR1w6uou": null, // global crm table
        "native-table-XOGyjLa2ya1pOloZYhys": null, // local crm table
        "native-table-ppOg3XcBCt4FF3uBTB7M": null, // global ffe table
        "native-table-HHiIkZIBAWcR71O4FnHq": null, // local ffe table
    },
    "ttl": 120
}

chrome.runtime.onInstalled.addListener(function () {
  console.log("DOM Element Clicker Extension Installed");
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        // const parsedUrl = new URL(changeInfo.url);
        // setUrl(parsedUrl.origin + parsedUrl.pathname);
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    setTimeout(function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            setUrl(tabs[0].url);
        });
    }, 50);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "sendClickedElement") {
    console.log("Clicked Element:", request.clickedElement);
    if (request.clickedElement.tag === "IMG") {
        image_headings = document.getElementsByClassName("image-heading");
        if (image_headings[1].classList.contains("selected")) {
            ffe_form_data.supporting_images.push(request.clickedElement.src);
        } else {
            ffe_form_data.main_image = request.clickedElement.src;
        }
        updateFFEImages();
    } else {
        var focusedInput = document.activeElement;
        if (focusedInput && focusedInput.tagName === 'INPUT') {
            focusedInput.value = request.clickedElement.text;
        }
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
    // initiate the cache
    initCache();

    // allow invalid inputs to reset upon input
    var uid_input = document.getElementById("uuid");
    uid_input.addEventListener("input", function (event) {
        event.preventDefault();
        uid_input.setCustomValidity("");
    });

    // load current tab url
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        setUrl(tabs[0].url);
    });

    // setup the dropdown to select an FFE category
    initFFECategories();

    // setup the dropdown to select the project this FFE item belongs to
    initFFEProject();

    // setup page transitions
    var login_btn = document.getElementById("login").getElementsByTagName("button")[0];
    login_btn.onclick = loginUser;

    var logout_btn = document.getElementById("header").getElementsByTagName("button")[0];
    logout_btn.onclick = logoutUser;

    var reload_btn = document.getElementById("reload");
    reload_btn.onclick = async function (event) {
        event.preventDefault();
        var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        setUrl(tabs[0].url);
    }

    // add remove on right click functionality for main image
    var main_img = document.getElementById("ffe-main-image").getElementsByTagName("img")[0];
    main_img.addEventListener("contextmenu", function(event) {
        event.preventDefault();
        ffe_form_data.main_image = null;
        updateFFEImages();
    });

    // add select between main and supporting images functionality
    image_headings = document.getElementsByClassName("image-heading");
    Array.from(image_headings).forEach(heading => heading.addEventListener("click", function (event) {
        event.preventDefault();
        Array.from(image_headings).forEach(function (h) {
            h.classList.remove("selected");
        });
        heading.classList.add("selected");
    }));

    //
    updateFFEImages();
});

async function initFFECategories() {
    var categories = await getData("native-table-czujI40m6ntKgs8PkHa1");
    var organisation_categories = filterMultipleData(categories, {"nGAzf": orgId}, {});

    var dropdown = document.getElementById("ffe-category");
    dropdown.innerHTML = '';

    var options = organisation_categories.map(function (cat) {
        const option = document.createElement('option');
        option.value = cat["$rowID"];
        option.text = cat["Name"] + " (" + cat["JHX0V"] + ")";
        return option;
    })
    const blank_option = document.createElement('option');
    blank_option.value = "";
    blank_option.text = "Select a category";
    options.unshift(blank_option);

    options.forEach(function (opt) {
        dropdown.appendChild(opt);
    });
}

async function initFFEProject() {
    var projects = await getData("native-table-et7uC7xaqClGCbW9ndNt");
    var organisation_projects = filterMultipleData(projects, {"SF2y6": orgId, "uuKW1": "Live"}, {});

    var dropdown = document.getElementById("ffe-project");
    dropdown.innerHTML = '';

    var options = organisation_projects.map(function (p) {
        const option = document.createElement('option');
        option.value = p["$rowID"];
        option.text = p["200B2"] + " - " + p["Name"];
        return option;
    });
    const blank_option = document.createElement('option');
    blank_option.value = "";
    blank_option.text = "Select a project";
    options.unshift(blank_option);

    options.forEach(function (opt) {
        dropdown.appendChild(opt);
    });
    // brand: { type: "string", name: "Name" },
    // location: { type: "string", name: "hdtiN" },
    // projectCode: { type: "string", name: "200B2" },
    // coverImage: { type: "image-uri", name: "MBlEQ" },
    // address: { type: "string", name: "sAyjm" },
    // organisationRowId: { type: "string", name: "SF2y6" },
    // projectStatus: { type: "string", name: "uuKW1" },
    // logo: { type: "image-uri", name: "4R4iI" },
    // specificationSchedule: { type: "uri", name: "xUQ1W" }
}

function resizeTextarea(textarea) {
    textarea.style.height = '';
    textarea.style.height = textarea.scrollHeight + 'px';
}

async function setUrl(url) {
    currentUrl = url;

    var webpage = document.getElementById("webpage");
    webpage.textContent = url;
    resizeTextarea(webpage);

    await enforceLogin();
}

// passing a nonexistent padeId hides all the content sections
function navigateTo(pageId) {
    var sections = document.querySelectorAll('section');
    sections.forEach(function(section) {
        section.classList.remove('active');
    });

    var selectedSection = document.getElementById(pageId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    if (pageId === "ffe-page") {
        transitionToFFE();
    } else if (pageId === "supplier-page") {
        transitionToSupplier();
    }
}

function updateFFEImages() {
    var main_img = document.getElementById("ffe-main-image").getElementsByTagName("img")[0];
    if (ffe_form_data.main_image) {
        main_img.src = ffe_form_data.main_image;
    } else {
        main_img.src = "";
    }

    var images = document.getElementById("ffe-supporting-images");
    images.innerHTML = '';
    for (var i = 0; i < ffe_form_data.supporting_images.length; i++) {
        var img = document.createElement("img");
        img.classList.add("ffe-image");
        img.src = ffe_form_data.supporting_images[i];
        img.dataset.index = i;
        img.addEventListener("contextmenu", function(event) {
            event.preventDefault();
            ffe_form_data.supporting_images.splice(event.target.dataset.index, 1);
            updateFFEImages();
        });

        images.appendChild(img);
    }
}


function filterData(data, parameters, transformFunctions) {
    for (const obj of data) {
        if (Array.isArray(obj.rows)) {
            for (const record of obj.rows) {
                let isMatch = true;
                for (const [param, requiredValue] of Object.entries(parameters)) {

                    const transformFunction = transformFunctions[param];
                    const transformedValue = transformFunction ? transformFunction(record[param]) : record[param];

                    if (transformedValue !== requiredValue) {
                        isMatch = false;
                        break;
                    }
                }

                if (isMatch) {
                    return record;
                }
            }
        }
    }

    return null;
}

function filterMultipleData(data, parameters, transformFunctions) {
    var filtered_items = [];

    for (const obj of data) {
        if (Array.isArray(obj.rows)) {
            for (const record of obj.rows) {
                let isMatch = true;
                for (const [param, requiredValue] of Object.entries(parameters)) {

                    const transformFunction = transformFunctions[param];
                    const transformedValue = transformFunction ? transformFunction(record[param]) : record[param];

                    if (transformedValue !== requiredValue) {
                        isMatch = false;
                        break;
                    }
                }

                if (isMatch) {
                    filtered_items.push(record);
                }
            }
        }
    }

    return filtered_items;
}

// fromCache indicates whether it is the cache calling this method
// prevents the cache from refreshing itself from itself - without reloading data from the api
async function getData(tableName, fromCache=false) {
    if (!fromCache && cache.tables[tableName]) {
        return cache.tables[tableName];
    } else {
        const endpoint = "https://api.glideapp.io/api/function/queryTables";
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 04fd8c7e-9ec4-4766-9496-88c35ca3b52c',
            },
            body: JSON.stringify({
                "appID": "JTibogkVNJdGSwrBH675",
                "queries": [
                    {
                        "tableName": tableName
                    }
                ]
            }),
        };

        var response = await fetch(endpoint, options);
        return response.json();
    }
}

async function postData(tableName, columns) {
    const endpoint = "https://api.glideapp.io/api/function/mutateTables";
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 04fd8c7e-9ec4-4766-9496-88c35ca3b52c',
        },
        body: JSON.stringify({
            "appID": "JTibogkVNJdGSwrBH675",
            "mutations": [
                {
                    "kind": "add-row-to-table",
                    "tableName": tableName,
                    "columnValues": columns
                }
            ]
        }),
    };

    var response = await fetch(endpoint, options);
    await loadTable(tableName);

    return response.json();
}

async function initCache() {
    for (const tableName of Object.keys(cache.tables)) {
        cacheHandler(tableName)();
    }
}

async function loadTable(tableName) {
    var data = await getData(tableName, true);
    cache.tables[tableName] = data;
}

function cacheHandler(tableName) {
    return async function () {
        console.log("Fetching data for table: ", tableName);
        await loadTable(tableName);

        setTimeout(
            cacheHandler(tableName),
            (cache.ttl + rand(0, 10)) * 1000.0
        );
    }
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}




async function loginUser() {
    var form = document.getElementById("login-page").getElementsByTagName("form")[0];
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    var uid_input = document.getElementById("uuid");
    var user_data = await getData("native-table-qQtBfW3I3zbQYJd4b3oF");
    var ud = filterData(user_data, {"$rowID": uid_input.value}, {});
    if (ud) {
        orgId = ud["M6JUX"];
        await chrome.storage.local.set({"uid": uid_input.value, "orgId": orgId});

        var logout_btn = document.getElementById("header").getElementsByTagName("button")[0];
        logout_btn.classList.add("active");

        navigateTo("supplier-page");
    } else {
        uid_input.setCustomValidity("Invalid UUID provided.");
        uid_input.reportValidity();
    }
}

async function logoutUser() {
    await chrome.storage.local.clear();
    uid = "";
    orgId = "";

    var logout_btn = document.getElementById("header").getElementsByTagName("button")[0];
    logout_btn.classList.remove("active");

    navigateTo("login-page");
}

async function enforceLogin() {
    var credentials = await chrome.storage.local.get(["uid", "orgId"]);
    if ("uid" in credentials) {
        uid = credentials["uid"];
        orgId = credentials["orgId"];

        var logout_btn = document.getElementById("header").getElementsByTagName("button")[0];
        logout_btn.classList.add("active");

        navigateTo("supplier-page");
    } else {
        navigateTo("login-page");
    }
}


async function transitionToFFE() {
    var exists = await ffeItemExists(currentUrl);
    if (!exists["global"] || (exists["global"] && !exists["local"])) {
        displayMessage("", false);

        const ffe_form = document.getElementById("ffe-page").getElementsByTagName("form")[0];
        clearForm(ffe_form);
        ffe_form_data.main_image = "";
        ffe_form_data.supporting_images = [];
        updateFFEImages();

        var ffe_btn = document.getElementById("ffe-page").getElementsByTagName("button")[0];
        ffe_btn.onclick = ffe_submit(exists["global"]);
    } else {
        displayMessage("This item already exists in the database. Visit another item url to add a new entry.", true);
    }
}

function ffe_submit(gId) {
    return async function (event) {
        event.preventDefault();

        var form = document.getElementById("ffe-page").getElementsByTagName("form")[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        var category_dropdown = document.getElementById("ffe-category");
        params = {
            "name": document.getElementById("ffe-name").value,
            "webpage": document.getElementById("webpage").value,
            "main_image": ffe_form_data.main_image,
            "supporting_images": ffe_form_data.supporting_images,
            "colour": document.getElementById("ffe-colour").value,
            "cost": document.getElementById("ffe-cost").value,
            "sku": document.getElementById("ffe-sku").value,
            "dimensions": document.getElementById("ffe-dimensions").value,
            "category": category_dropdown.options[category_dropdown.selectedIndex].value,
        };

        var project_dropdown = document.getElementById("ffe-project");
        if (project_dropdown.options[project_dropdown.selectedIndex].value != "") {
            params.project = project_dropdown.options[project_dropdown.selectedIndex].value;
        }
        
        var loader = document.getElementById('loading-container');
        loader.style.display = 'block';
        await uploadFFEItem(gId, params);
        loader.style.display = 'none';

        transitionToFFE();
    }
}

async function transitionToSupplier() {
    companyData = await crmCompanyExists(currentUrl);
    if (!companyData["global"] || (companyData["global"] && !companyData["local"])) {
        displayMessage("It seems like this company is not in your database. Make sure to add it.", false);

        const supplier_form = document.getElementById("supplier-page").getElementsByTagName("form")[0];
        clearForm(supplier_form);

        var supplier_btn = document.getElementById("supplier-page").getElementsByTagName("button")[0];
        supplier_btn.onclick = supplier_submit(companyData["global"]);
    } else {
        displayMessage("", false);
        navigateTo("ffe-page");
    }
}

function supplier_submit(gId) {
    return async function (event) {
        event.preventDefault();

        var form = document.getElementById("supplier-page").getElementsByTagName("form")[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        params = {
            "name": document.getElementById("supplier-name").value,
            "website": document.getElementById("webpage").value
        }

        var loader = document.getElementById('loading-container');
        loader.style.display = 'block';
        await uploadCRMCompany(gId, params);
        loader.style.display = 'none';

        displayMessage("", false);
        navigateTo("ffe-page");
    }
}


function clearForm(form) {
    for (let i = 0; i < form.elements.length; i++) {
        let element = form.elements[i];
        if (element.type === 'text' || element.type === 'email' || element.tagName.toLowerCase() === 'textarea') {
            element.value = '';
        }
    }
}

function displayMessage(message, hideContent) {
    var webpage_message = document.getElementById("webpage-message");
    webpage_message.textContent = message;

    if (hideContent) {
        navigateTo("");
    }
}




async function crmCompanyExists(url) {
    var existing_global_companies = await getData("native-table-VFCp81n4o1CXLR1w6uou");
    var current_host = new URL(url).host;
    var egc = filterData(existing_global_companies, {"ghxQQ": current_host}, {"ghxQQ": uri => new URL(uri).host});
    if (!egc) {
        return {"global": null, "local": null, "name": ""};
    } else {
        var existing_local_companies = await getData("native-table-XOGyjLa2ya1pOloZYhys");
        var elc = filterData(existing_local_companies, {"gScX9": orgId, "ZAM4C": egc["$rowID"]}, {});
        if (!elc) {
            return {"global": egc["$rowID"], "local": null, "name": egc["Name"]};
        } else {
            return {"global": egc["$rowID"], "local": elc["$rowID"], "name": egc["Name"]};
        }
    }
}

async function uploadCRMCompany(gId, params) {
    if (!gId) {
        var globalId = await uploadGlobalCRMCompany(params);
        params["globalCRMId"] = globalId;
        await uploadOrganisationCRMCompany(params);
    } else {
        params["globalCRMId"] = gId;
        await uploadOrganisationCRMCompany(params);
    }
}

async function uploadGlobalCRMCompany(params) {
    var submitted_company = await postData(
        "native-table-VFCp81n4o1CXLR1w6uou",
        {
            "Name": params["name"], //name
            "ghxQQ": params["website"], //website
            "GApZH": "Supplier" //type
        }
    );

    return submitted_company[0]["rowID"];
}

async function uploadOrganisationCRMCompany(params) {
    var submitted_company = await postData(
        "native-table-XOGyjLa2ya1pOloZYhys",
        {
            "gScX9": orgId, //organisationId
            "ZAM4C": params["globalCRMId"] //globalCrmCompanyId
        }
    );

    return submitted_company[0]["rowID"];
}




async function ffeItemExists(url) {
    var existing_global_items = await getData("native-table-ppOg3XcBCt4FF3uBTB7M");
    var egi = filterData(existing_global_items, {"L28Mr": url}, {});
    if (!egi) {
        return {"global": null, "local": null, "name": ""};
    } else {
        var existing_local_items = await getData("native-table-HHiIkZIBAWcR71O4FnHq");
        var eli = filterData(existing_local_items, {"RWJXT": orgId, "6RcDK": egi["$rowID"]}, {});
        if (!eli) {
            return {"global": egi["$rowID"], "local": null, "name": egi["Name"]};
        } else {
            return {"global": egi["$rowID"], "local": eli["$rowID"], "name": egi["Name"]};
        }
    }
}

async function uploadFFEItem(gId, params) {
    if (!gId) {
        var globalId = await uploadGlobalFFEItem(params);
        params["globalFFEId"] = globalId;
        await uploadOrganisationFFEItem(params);
    } else {
        params["globalFFEId"] = gId;
        await uploadOrganisationFFEItem(params);
    }
}

async function uploadGlobalFFEItem(params) {
    var submitted_item = await postData(
        "native-table-ppOg3XcBCt4FF3uBTB7M",
        {
            "Name": params["name"], //name
            "L28Mr": params["webpage"] //webpage
        }
    );

    return submitted_item[0]["rowID"];
}

async function uploadOrganisationFFEItem(params) {
    console.log("Received global ffe id: ", params["globalFFEId"]);
    var submitted_item = await postData(
        "native-table-HHiIkZIBAWcR71O4FnHq",
        {
            "Name": params["name"], //name
            "Ih8oG": params["main_image"], //main image
            "LOn14": params["supporting_images"],
            "16TCS": params["colour"], //colour
            "6FY82": params["cost"], //cost
            "EDelh": params["sku"], //sku
            "L28Mr": params["webpage"], //webpage
            "RWJXT": orgId, //organisationId
            "KgzGY": params["dimensions"], //dimensions
            "tnIaQ": params["category"], //category
            "6RcDK": params["globalFFEId"] //globalFfEId
        }
    );

    if (params.project !== undefined) {
        await postData(
            "native-table-4H0y5hUGLSO72r33cdFw",
            {
                "XBPgT": params["project"], //projectId
                "2HkCX": submitted_item[0]["rowID"] //organisationLibraryItemId
            }
        );
    }

    return submitted_item[0]["rowID"];
}
