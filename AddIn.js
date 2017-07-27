
var Server = "AddIn";
var IsConnectAddIn = false;
var DefaultServer = "none"; //"AddIn";
var User = "Admin";
var Pass = "";
var DefaultKkt = "0";
var DefaultCashierName = "";
var CashierNames = new Array();
var Servers = new Set();
var UrlAddIn = "";
var hostName = "kkmserver.addin.io";
var ServerInstall = true;
var List;
var VersonComponent = "";
var VersonAddIn = "2.0.24.26";

////////////////////////////////////////////////////////////////////////////////////////////
// Механизмы


document.addEventListener('DOMContentLoaded', OnStart);

function OnStart() {
  //
  //chrome.runtime.getPlatformInfo(
  //
  //

  //function OnStart1(platformInfo) {

  //localStorage["AddIn.Servers"] = new Set();
  //localStorage["AddIn.CashierNames"] = new Array();

  document.getElementById('SetServer').addEventListener('change', SetServer);
  document.getElementById('InputServer').addEventListener('change', InputServer);
  document.getElementById('InputServerClear').addEventListener('click', InputServerClear);
  document.getElementById('User').addEventListener('change', ChangeUser);
  document.getElementById('Pass').addEventListener('change', ChangePass);
  document.getElementById('Settings').addEventListener('click', Settings);
  document.getElementById('DefaultKkt').addEventListener('change', ChangeDefaultKkt);
  document.getElementById('SetDefaultCashierName').addEventListener('change', ChangeSetDefaultCashierName);
  document.getElementById('DefaultCashierName').addEventListener('change', ChangeDefaultCashierName);
  document.getElementById('DefaultCashierNameClear').addEventListener('click', DefaultCashierNameClear);
  document.getElementById('Home').addEventListener('click', Home);
  document.getElementById('Forum').addEventListener('click', Forum);
  document.getElementById('Mail').addEventListener('click', Mail);
  document.getElementById('GetApp').addEventListener('click', GetApp);

  Server = localStorage["AddIn.Server"];
  if (Server == undefined) {
    Server = DefaultServer;
  };
  User = localStorage["AddIn.User"];
  if (User == undefined) {
    User = "Admin";
  };
  Pass = localStorage["AddIn.Pass"];
  DefaultKkt = localStorage["AddIn.DefaultKkt"];
  if (DefaultKkt == undefined) {
    DefaultKkt = "0";
  };
  DefaultCashierName = localStorage["AddIn.DefaultCashierName"];
  StrCashierNames = localStorage["AddIn.CashierNames"]
  if (StrCashierNames != "" && StrCashierNames != undefined) {
    CashierNames = StrCashierNames.split(';;');
  } else {
    CashierNames = new Array();
  };
  if (CashierNames == undefined) {
    CashierNames = new Array();
    if (DefaultCashierName != undefined && DefaultCashierName != "") {
      CashierNames.push(DefaultCashierName);
    }
  };

  // А сервер-то стоит?
  GetServerInstall();

  // Получаем настройки расширения
  if (Server != "none") {
    GetSettingsServer();
  };

  // Получаем список серверов
  Servers.clear();

  for (i = 3; i < 6; i++) {
    for (s = 0; s < 2; s++) {
      var Host = "";
      if (s == 0) {
        Host = "http://localhost:" + (5890 + i);
      } else {
        Host = "https://localhost:" + (5890 + i);
      };
      ExecuteCommand({ Com: "Test" }, Host + "/VersionJSON", 2000,
        function (Rezult, textStatus, jqXHR) {
          var UrlServer = this.url;
          UrlServer = UrlServer.substr(0, UrlServer.indexOf("/VersionJSON"));
          Servers.add(UrlServer);
          //if (DefaultServer == "AddIn") {
          //    TextCert = "<option value=\"AddIn\">Встроенный сервер ККТ</option>";
          //} else {
          //    TextCert = "<option value=\"none\">Не настроенно</option>";
          //};
          //Servers.forEach(function (value) {
          //    TextCert = TextCert + "<option value=\"" + value + "\">" + value + "</option>";
          //});
          //TextCert = TextCert + "<option value=\"\">Другой сервер...</option>";
          //$('#SetServer').html(TextCert);
          //$("#SetServer").val(Server);
          updateUiState();
        },
        function (jqXHR, textStatus, errorThrown) {
        }
      );
    };
  };

  updateUiState();

  //}
  //);
}

function updateUiState() {

  var IsEdit = false;

  if (Server == "") {
    IsEdit = true;
  } else if (Server == "none") {
    IsEdit = false;
  } else if (Server != "AddIn") {
    IsEdit = true;
    Servers.forEach(
      function (value) {
        if (Server == value) {
          IsEdit = false;
        };
      }
    );
  };

  // Обновляем список серверов
  if (DefaultServer == "AddIn" || Server == "AddIn") {
    TextCert = "<option value=\"AddIn\">Встроенный сервер ККТ</option>";
  };
  if (DefaultServer == "none" || Server == "none") {
    TextCert = "<option value=\"none\">Не настроенно</option>";
  };
  Servers.forEach(function (value) {
    TextCert = TextCert + "<option value=\"" + value + "\">" + value + "</option>";
  });
  TextCert = TextCert + "<option value=\"\">Другой сервер...</option>";
  $('#SetServer').html(TextCert);
  $("#SetServer").val(Server);

  // Обновляем список ККТ
  TextCert = "<option value='0'>Нет</option>";
  if (List != undefined) {
    List.forEach(function (value) {
      if (value.TypeDevice == "Фискальный регистратор") {
        TextCert = TextCert + "<option value='" + value.NumDevice + "'>" + value.NumDevice + "-" + value.NameDevice + "</option>";
      };
    });
  };
  $('#DefaultKkt').html(TextCert);
  $("#DefaultKkt").val(DefaultKkt);

  // Обновляем список кассиров
  TextCert = "";
  if (CashierNames != undefined) {
    for (var i in CashierNames) {
      TextCert = TextCert + "<option value='" + CashierNames[i] + "'>" + CashierNames[i] + "</option>";
    };
  };
  if (DefaultCashierName == undefined) {
    DefaultCashierName = "";
  };
  TextCert = TextCert + "<option value=''>Другой..</option>";
  $('#SetDefaultCashierName').html(TextCert);


  // Видимость элементов
  document.getElementById('Version').innerText = "Ver: " + VersonAddIn;

  height = 64 + 31;
  if (DefaultServer == "none" && ServerInstall == false) {
    //document.getElementById('DivRun').style.display = 'none';
    document.getElementById('DivNotRun').style.display = 'block';
    document.getElementById('LabelInstall').innerText = "Компонента доступа к оборудованию не установлена:";
    document.getElementById('GetApp').value = "Установить компонену"
    height += 169;
  } else if (Server == "AddIn" && ServerInstall == true && VersonComponent != "" && VersonComponent < VersonAddIn) {
    //document.getElementById('DivRun').style.display = 'none';
    document.getElementById('DivNotRun').style.display = 'block';
    document.getElementById('LabelInstall').innerText = "Необходимо обновить компоненту доступа к оборудованию до версии " + VersonAddIn + ":";
    document.getElementById('GetApp').value = "Обновить компонену"
    height += 169;
  } else {
    //document.getElementById('DivRun').style.display = 'block';
    document.getElementById('DivNotRun').style.display = 'none';
  };

  if (IsEdit == false) {
    document.getElementById('DivInputServer').style.display = 'none';
    document.getElementById('SetServer').style.display = 'block';
    $("#SetServer").val(Server);
  } else {
    document.getElementById('SetServer').style.display = 'none';
    document.getElementById('DivInputServer').style.display = 'inline';
    $("#InputServer").val(Server);
  };

  if (Server == "AddIn" || Server == "none") {
    document.getElementById('LabelUser').style.display = 'none'; //.disabled = 1;
    document.getElementById('User').style.display = 'none'; //.disabled = 1;
    document.getElementById('LabelPass').style.display = 'none'; //.disabled = 1;
    document.getElementById('Pass').style.display = 'none'; //.disabled = 1;
    $("#User").val(User);
    $("#Pass").val(Pass);
  } else {
    document.getElementById('LabelUser').style.display = 'block'; //.disabled = 1;
    document.getElementById('User').style.display = 'block'; //.disabled = 0;
    document.getElementById('LabelPass').style.display = 'block'; //.disabled = 1;
    document.getElementById('Pass').style.display = 'block'; //.disabled = 0;
    $("#User").val(User);
    $("#Pass").val(Pass);
    height += 35 * 2;
  };

  if (DefaultCashierName != "") {
    document.getElementById('DivDefaultCashierName').style.display = 'none';
    document.getElementById('DivSetDefaultCashierName').style.display = 'inline';
    $("#SetDefaultCashierName").val(DefaultCashierName);
    $("#DefaultCashierName").val(DefaultCashierName);
  } else {
    document.getElementById('DivSetDefaultCashierName').style.display = 'none';
    document.getElementById('DivDefaultCashierName').style.display = 'block';
    $("#SetDefaultCashierName").val(DefaultCashierName);
    $("#DefaultCashierName").val(DefaultCashierName);
  };

  //$('body').css('height', '' + height + 'px');
  //document.getElementsByTagName('body').style.height = '' + height+'px'; //.disabled = 0;
}

function GetServerInstall(CallBack) {

  //
  Port = chrome.runtime.connect({ name: "kkmserver.addin" });
  //
  //
  Port.postMessage({ Command: "AddInServerInstall" });
  Port.onMessage.addListener(
    function (message, Port) {
      ServerInstall = message.ServerInstall;
      if (ServerInstall == false) {
        DefaultServer = "none";
      } else {
        DefaultServer = "AddIn";
      };
      if (ServerInstall == false && Server == "AddIn") {
        Server = "none";
        DefaultServer = "none";
      } else if (ServerInstall == true && Server == "none") {
        Server = "AddIn";
      };
      localStorage["AddIn.Server"] = Server;
      if (Server != "none") {
        GetSettingsServer();
      };
      updateUiState();
    }
  );

}

function GetSettingsServer(CallBack) {

  if (Server == "AddIn") {
    //
    var Port = chrome.runtime.connect({ name: "kkmserver.addin" });
    //
    //
    Port.postMessage({ Command: "AddInGetSettings" });
    Port.onMessage.addListener(
      function (message, Port) {
        UrlAddIn = message.Url;
        User = message.LoginAdmin;
        Pass = message.PassAdmin;
        localStorage["AddIn.User"] = User;
        localStorage["AddIn.Pass"] = Pass;
        VersonComponent = message.Verson;
        List = message.List.ListUnit;
        updateUiState();
        if (CallBack != undefined) {
          CallBack();
        };
      }
    );
  } else if (Server != "none") {
    //
    var Port = chrome.runtime.connect({ name: "kkmserver.addin" });
    //
    //
    Port.postMessage({ Command: "List" });
    Port.onMessage.addListener(
      function (message, Port) {
        List = message.ListUnit;
        updateUiState();
        if (CallBack != undefined) {
          CallBack();
        };
      }
    );
  };
}


////////////////////////////////////////////////////////////////////////////////////////////
// Форма

function SetServer() {
  Server = $("#SetServer").val();
  User = "Admin";
  Pass = "";
  localStorage["AddIn.Server"] = Server;
  localStorage["AddIn.User"] = User;
  localStorage["AddIn.Pass"] = Pass;
  // Получаем настройки расширения
  if (Server != "none") {
    GetSettingsServer();
  };
  updateUiState();
}

function InputServer() {
  Server = $("#InputServer").val();
  User = "Admin";
  Pass = "";
  localStorage["AddIn.Server"] = Server;
  localStorage["AddIn.User"] = User;
  localStorage["AddIn.Pass"] = Pass;
  // Получаем настройки расширения
  if (Server == "none") {
    GetSettingsServer();
  };
  updateUiState();
}

function InputServerClear() {
  Server = DefaultServer;
  localStorage["AddIn.Server"] = Server;
  if (Server != "none") {
    GetSettingsServer();
  };
  updateUiState();
}

function ChangeUser() {
  User = $("#User").val();
  localStorage["AddIn.User"] = User;
}

function ChangePass() {
  Pass = $("#Pass").val();
  localStorage["AddIn.Pass"] = Pass;
}

function ChangeDefaultKkt() {
  DefaultKkt = $("#DefaultKkt").val();
  localStorage["AddIn.DefaultKkt"] = DefaultKkt;
}

function ChangeSetDefaultCashierName() {
  DefaultCashierName = $("#SetDefaultCashierName").val();
  updateUiState();
}

function ChangeDefaultCashierName() {
  DefaultCashierName = $("#DefaultCashierName").val();
  localStorage["AddIn.DefaultCashierName"] = DefaultCashierName;

  // Обновляем список касиров
  NewCashierNames = new Array();
  if (DefaultCashierName != "") {
    NewCashierNames.push(DefaultCashierName);
    for (var i in CashierNames) {
      if (i > 10) {
        break;
      };
      if (CashierNames[i] != DefaultCashierName) {
        NewCashierNames.push(CashierNames[i]);
      };
    };
    CashierNames = NewCashierNames;
  };
  localStorage["AddIn.CashierNames"] = CashierNames.join(';;');
  updateUiState();
}

function DefaultCashierNameClear() {
  if (CashierNames.length > 0) {
    DefaultCashierName = CashierNames[0];
    localStorage["AddIn.DefaultCashierName"] = DefaultCashierName;
    updateUiState();
  };
}

function Settings() {

  if (Server == "AddIn") {

    GetSettingsServer(
      function () {
        var Url;
        if (UrlAddIn != "") {
          Url = UrlAddIn;
        } else {
          Url = "http://localhost:5890";
        };
        if (User !== "" || Password !== "") {
          Url += "?Basic=" + btoa(User + ":" + Pass)
        };
        //
        chrome.tabs.create({ url: Url });
        //
        //

      }
    );

  } else {

    var Url = Server;
    if (User !== "" || Password !== "") {
      Url += "?Basic=" + btoa(User + ":" + Pass)
    };
    //
    chrome.tabs.create({ url: Url });
    //
    //
  };

}

function Home() {
  //
  chrome.tabs.create({ url: "https://kkmserver.ru/AddIn" });
  //
  //
}

function Forum() {
  //
  chrome.tabs.create({ url: "http://forum.kkmserver.ru" });
  //
  //
}

function Mail() {
  //
  chrome.tabs.create({ url: "mailto:kkmserver@gmail.com" });
  //
  //
}

function GetApp() {
  //
  chrome.tabs.create({ url: "https://KkmServer.ru/Donload/Setup_AddIn.exe" });
  //
  //
}

////////////////////////////////////////////////////////////////////////////////////////////
// Механизмы

function ExecuteCommand(Data, UrlServer, timeout, FunSuccess, FunError) {

  if (timeout == undefined) {
    timeout = 60000; //Минута - некоторые драйверы при работе выполняют интерактивные действия с пользователем - тогда увеличьте тайм-аут.
  }

  var JSon = $.toJSON(Data);

  $.support.cors = true;
  var jqXHRvar = $.ajax({
    type: 'POST',
    async: true,
    timeout: timeout,
    url: UrlServer,
    crossDomain: true,
    dataType: 'json',
    contentType: 'application/json; charset=UTF-8',
    processData: false,
    data: JSon,
    headers: (User !== "" || Password !== "") ? { "Authorization": "Basic " + btoa(User + ":" + Pass) } : { "Authorization": "Basic " + btoa(User + ":" + Pass) },
    success: FunSuccess,
    error: FunError
  });
}