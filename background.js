
// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var PortServer = null;
var ServerHost = "";
var hostName = "kkmserver.addin.io";
var ServerRun = false;
var ConnectPotRun = false;
var BeforeRequestRun = false;
var Error = "";
var Id = "";
var QueryResponses = new Map();
var User = "Admin";
var Password = "1";
var IdAppChrom = "mjeeklofjbnodnnfibjolokichkhcpog";
var IdAppOpera = "dkbekbmeodgkglklclonfbglkbglinlm";
var IdAppFirefox = "f0fc9992-333c-4f09-8b33-f56bc9f3131a";
var ServerInstall = true;

///////////////////////////////////////////////////////////////////////////
//  Связь с сервером
///////////////////////////////////////////////////////////////////////////

document.write('<script src="jquery.min.js" type="text/JavaScript"><\/script>');
document.write('<script src="jquery.json.min.js" type="text/JavaScript"><\/script>');
connect();


function connect() {

    // Настройка
    ServerHost = localStorage["AddIn.Server"];
    if (ServerHost == undefined) {
        ServerHost = "AddIn";
    };

    // Запускаем KkmServer
    //if (ServerHost == "AddIn" && ServerRun == false) {
    if (ServerRun == false) {

        //
        PortServer = chrome.runtime.connectNative(hostName);
        //
        //
        PortServer.onDisconnect.addListener(onNativeDisconnected);
        PortServer.onMessage.addListener(onNativeMessage);

        ServerRun = true;

    };

    // Запускаем прослушиватель
    if (ConnectPotRun == false) {
        //
        chrome.runtime.onConnect.addListener(onConnectPot);
        //
        //
        ConnectPotRun = true;
    };

    if (BeforeRequestRun == false) {
        //chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, { urls: ["*://localhost/*"] }, ['blocking']);
        //chrome.webRequest.onErrorOccurred.addListener(onErrorOccurred, { urls: ["*://localhost/*"] }, ['blocking']);
        //chrome.webRequest.onCompleted.addListener(onCompleted, { urls: ["*://localhost/*"] }, []);
        BeforeRequestRun = true;
    };

}


// При ошибке приложения
function onNativeDisconnected() {
    //
    Error = chrome.runtime.lastError.message;
    //
    //
    console.log("Failed to connect: " + Error);
    port = null;
    ServerInstall = false;
    ServerRun = false;
}

// Сообщения от приложения
function onNativeMessage(message) {
    //Проверяем наличие
    ServerInstall = true;
    forConnectPot(message);
}


// Сообщения от страниц
function onConnectPot(Port) {
    if (Port.name == "kkmserver.addin") {
        Port.onMessage.addListener(
            function (message, Port) {

                if (Port.sender != undefined && Port.sender != null && "id" in Port.sender) {
                    if (message.Command == "AddInServerInstall") {
                        forKkmServer(undefined, { Command: "AddInGetSettings" }, "AddIn");
                        Port.postMessage({ Command: "AddInServerInstall", ServerInstall: ServerInstall });
                    } else {
                        forKkmServer(Port, message);
                    };
                };

            }
        );
    };
}

// Сообщения на страницу
function forConnectPot(message) {
    //Проверяем наличие
    if (QueryResponses.has(message.IdCommand) == true) {
        try {
            Port = QueryResponses.get(message.IdCommand);
            Port.postMessage(message);
            QueryResponses.delete(message.IdCommand);
        } catch (err) { };
        IsRun = false;
    } else {
        if (message.Command == "GetRezult") {
            try {
                Port = QueryResponses.get(message.Rezult.IdCommand +"GetRezult");
                Port.postMessage(message);
                QueryResponses.delete(message.IdCommand);
            } catch (err) { };
            IsRun = false;
        } else if (message.Command == "AddInShowHtmlInTab") {
            //
            chrome.tabs.create({ url: chrome.extension.getURL("Check.html") },
                function (tab) {
                    setTimeout(
                        function () {
                            var Port = chrome.runtime.connect({ name: "kkmserver.addin" });
                            Port.postMessage({ Command: "kkmserver.addin.ShowChek", html: message.html, TabId: tab.id });
                        }, 100
                    );
                }
            );
            //
            //
        };

        if (message.Command == "EventBarcode") {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { name: "kkmserver.addin.EventBarcode", message: message }, function(response) { });
            });
        };

    };
    //Responses.set(message.IdCommand, Responses);
}


// отправка на kkmserver
function forKkmServer(Port, message, CurServerHost) {

    // Настройка
    connect();

    // Проверяем что есть идентификатор
    if ("IdCommand" in message == false) {
        message.IdCommand = guid();
    };
    if (message.IdCommand == "") {
        message.IdCommand = guid();
    };

    //Устанавливаем значения по умолчанию
    var IsCommandKKT = message.Command == "RegisterCheck"
        || message.Command == "OpenShift"
        || message.Command == "ZReport"
        || message.Command == "XReport"
        || message.Command == "OfdReport"
        || message.Command == "OpenCashDrawer"
        || message.Command == "DepositingCash"
        || message.Command == "PaymentCash"
        || message.Command == "GetLineLength"
        || message.Command == "KkmRegOfd"
        || message.Command == "GetDataKKT";
    DefaultKkt = localStorage["AddIn.DefaultKkt"];
    if (IsCommandKKT == true
        && (message.NumDevice == 0 || message.NumDevice == "0" || message.NumDevice == undefined)
        && DefaultKkt != "0" && DefaultKkt != 0 && DefaultKkt != undefined) {
        message.NumDevice = DefaultKkt;
    };
    DefaultCashierName = localStorage["AddIn.DefaultCashierName"];
    if (IsCommandKKT == true
        && (message.CashierName == "" || message.CashierName == undefined)
        && DefaultCashierName != "" && DefaultCashierName != undefined) {
        message.CashierName = DefaultCashierName;
    };

    // Запоминаем порт
    if (Port != undefined) {
        if (message.Command == "GetRezult") {
            QueryResponses.set(message.IdCommand + "GetRezult", Port);
        } else {
            QueryResponses.set(message.IdCommand, Port);
        };
    };

    // Выполняем команду
    if (CurServerHost == undefined) {
        ServerHost = localStorage["AddIn.Server"];
        CurServerHost = ServerHost;
    };
    if (CurServerHost == "AddIn") {

        try {
            Error = "";
            PortServer.postMessage(message);
            //ServerInstall = true;
        } catch (ex) {
            //
            forConnectPot(
                {
                    Command: message.Command,
                    Error: "Ошибка расширения: " + ex.message,
                    Status: 2,
                    IdCommand: message.IdCommand,
                }
            );
            // Заново запускаем сервер
            ServerRun = false;
            connect();
        };

    } else if (CurServerHost == "none") {

        forConnectPot(
            {
                Command: message.Command,
                Error: "Расширение браузера kkmserver не настроенно!",
                Status: 2,
                IdCommand: message.IdCommand,
            }
        );

    } else {

        var JSon = $.toJSON(message);

        $.support.cors = true;
        var jqXHRvar = $.ajax({
            type: 'POST',
            async: true,
            timeout: 60000,
            url: CurServerHost + '/Execute',
            crossDomain: true,
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8',
            processData: false,
            data: JSon,
            headers: (User !== "" || Password !== "") ? { "Authorization": "Basic " + btoa(User + ":" + Password) } : "",
            success: function (Rezult, textStatus, jqXHR) {
                forConnectPot(Rezult);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                forConnectPot(
                    {
                        Command: message.Command,
                        Error: textStatus + ": " + errorThrown.message,
                        Status: 2,
                        IdCommand: message.IdCommand,
                    }
                );
            }
        });
    };

};

///////////////////////////////////////////////////////////////////////////
//  Связь с приложениями
///////////////////////////////////////////////////////////////////////////

// Герерация GUID
function guid() {

    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function ShowHtmlInTab(Url) {

    //
    chrome.tabs.create({ url: chrome.extension.getURL(Url) });
    //
    //

}

///////////////////////////////////////////////////////////////////////////
//  Страница настроек
///////////////////////////////////////////////////////////////////////////

function onBeforeRequest(details) {
    if (details.url.toLowerCase().indexOf("localhost:5890") != -1) {
        return { redirectUrl: 'extension://' + IdApp + '/html/AddInChrome/AddIn.html' };
    } else {
        return {};
    };
}

function onErrorOccurred(details) {
    return {};
}

function onCompleted(details) {
    return {};
}

