//////////////////////////////////////////////////////////
// kkmserver
//////////////////////////////////////////////////////////

if (!window.KkmServer) {

  KkmServer = {

    Command: "",
    NumDevice: 0,
    IdCommand: undefined,

    DefaultSettings: {
      funCallBack: undefined,
      Timeout: 30,
      CashierName: "",
      CheckProps: [],
      KeySubLicensing: ""
    },

    _QueryResponses: new Map(),
    _ListBarCodeEvent: new Set(),

    // Выполняет команду на KkmServer
    Execute: function (funCallBack = undefined, Data) {

      if (Data == undefined) {
        Data = KkmServer.extend({}, this, true, true);
      } else {
        Data = KkmServer.extend({}, Data, true, true);
      };

      if (funCallBack == undefined) {
        funCallBack = this.DefaultSettings.funCallBack;
      };
      if (Data.IdCommand == undefined) {
        Data.IdCommand = this.NewGuid();
      };
      if (Data.Timeout == undefined) {
        Data.Timeout = this.DefaultSettings.Timeout;
      };
      if (Data.KeySubLicensing == undefined && this.DefaultSettings.KeySubLicensing != "") {
        Data.KeySubLicensing = this.DefaultSettings.KeySubLicensing;
      };
      if (Data.Command == "" || Data.Command == undefined) {
        funCallBack({
          Command: "<Не указано>",
          Error: "Ошибка вызова: не заполнена команда",
          Status: 2,
          IdCommand: Data.IdCommand,
        });
        return this;
      };
      if (Data.Command == "GetRezult") {
        KkmServer._QueryResponses.set(Data.IdCommand + "GetRezult", funCallBack);
      } else {
        KkmServer._QueryResponses.set(Data.IdCommand, funCallBack);
      };
      window.postMessage({ Data: Data, To: "Server" }, "*");

      return Data;
    },

    // Получение списка устройств
    List: function () {
      Data = KkmServer.extend({}, KkmServer);

      Data.Command = "List";
      Data.InnKkm = "";
      Data.Active = null;
      Data.OnOff = null;
      Data.OFD_Error = null;
      Data.OFD_DateErrorDoc = '2100-01-01T00:00:00';
      Data.FN_DateEnd = '2100-01-01T00:00:00';
      Data.FN_MemOverflowl = null;
      Data.FN_IsFiscal = null;

      return Data;
    },

    // Возвращает данные для заполнения чека по ФФД вер. 1.0
    GetDataCheck_1_0: function (TypeCheck = 0, NumDevice = 0, InnKkm = "", CashierName = "") {

      Data = KkmServer.extend({}, KkmServer);

      if (CashierName == "" || CashierName == undefined) {
        CashierName = this.DefaultSettings.CashierName;
      }

      // Подготовка данных команды
      Data.VerFFD = "1.0";
      Data.Command = "RegisterCheck";
      Data.NumDevice = NumDevice;
      Data.InnKkm = InnKkm;
      Data.KktNumber = "";
      Data.IsFiscalCheck = true;
      Data.TypeCheck = TypeCheck;
      Data.CancelOpenedCheck = true;
      Data.NotPrint = false;
      Data.NumberCopies = 0;
      Data.CashierName = CashierName;
      Data.ClientAddress = "";
      Data.TaxVariant = "";
      Data.CheckProps = [];
      Data.AdditionalProps = [];
      Data.KPP = "";
      Data.ClientId = "";
      Data.KeySubLicensing = "";
      Data.CheckStrings = [];
      Data.Cash = 0;
      Data.CashLessType1 = 0;
      Data.CashLessType2 = 0;
      Data.CashLessType3 = 0;

      // Добаляет фискальную строку и возвращает ее для заполнения
      Data.AddRegisterString = function AddRegisterString(Name, Quantity, Price, Amount, Tax, Department, EAN13, SignMethodCalculation, SignCalculationObject, NomenclatureCode, MeasurementUnit) {
        var NewData = {
          Register: {
            Name: Name,
            Quantity: Quantity,
            Price: Price,
            Amount: Amount,
            Department: Department,
            Tax: Tax,
            EAN13: EAN13,
            EGAIS: null,
          }
        };

        Data.CheckStrings.push(NewData);
        return NewData.Register;
      };

      // Добаляет простую строку и возвращает ее для заполнения
      Data.AddTextString = function (Text, Font, Intensity) {

        var NewData = {
          PrintText: {
            Text: Text,
            Font: Font,
            Intensity: Intensity,
          }
        };

        Data.CheckStrings.push(NewData);
        return NewData.PrintText;

      };

      // Добаляет данные для печати ШК и возвращает ее для заполнения
      Data.AddBarcodeString = function (BarcodeType, Barcode) {

        var NewData = {
          BarCode: {
            BarcodeType: BarcodeType,
            Barcode: Barcode,
          }
        };

        Data.CheckStrings.push(NewData);
        return NewData.BarCode;

      };

      // Добаляет данные для печати картинки и возвращает ее для заполнения
      Data.AddImageString = function (Image) {

        var NewData = {
          PrintImage: {
            Image: Image,
          },
        };

        Data.CheckStrings.push(NewData);
        return NewData.PrintImage;

      };

      // Добаляет данные по дополнительным тегам
      Data.AddCheckProps = function (Print, PrintInHeader, Teg, Prop) {

        var NewData = {
          Print: Print,
          PrintInHeader: PrintInHeader,
          Teg: Teg,
          Prop: Prop
        };

        Data.CheckProps.push(NewData);
        return Data;

      };

      for (var i = 0; i < this.DefaultSettings.CheckProps.length; i++) {
        var Prop = this.DefaultSettings.CheckProps[i];
        Data.AddCheckProps(Prop.Print, Prop.PrintInHeader, Prop.Teg, Prop.Prop);
      };

      return Data;
    },

    OpenShift: function (NumDevice = 0, CashierName = "") {

      Data = KkmServer.extend({}, KkmServer);

      Data.Command = "OpenShift";
      Data.NumDevice = NumDevice;
      Data.CashierName = CashierName;

      return Data;
    },

    ZReport: function (NumDevice = 0, CashierName = "") {

      Data = KkmServer.extend({}, KkmServer);
      Data.Command = "ZReport";
      Data.NumDevice = NumDevice;
      Data.CashierName = CashierName;

      return Data;
    },

    XReport: function (NumDevice = 0) {

      Data = KkmServer.extend({}, KkmServer);
      Data.Command = "XReport";
      Data.NumDevice = NumDevice;
      return Data;
    },

    OfdReport: function (NumDevice = 0) {

      Data = KkmServer.extend({}, KkmServer);
      Data.Command = "OfdReport";
      Data.NumDevice = NumDevice;
      return Data;
    },

    OpenCashDrawer: function (NumDevice = 0) {

      Data = KkmServer.extend({}, KkmServer);
      Data.Command = "OpenCashDrawer";
      Data.NumDevice = NumDevice;

      return Data;
    },

    DepositingCash: function (NumDevice = 0, Amount = 0, CashierName = "") {

      Data = KkmServer.extend({}, KkmServer);
      Data.Command = "DepositingCash";
      Data.NumDevice = NumDevice;
      Data.Amount = Amount;
      Data.CashierName = CashierName;

      return Data;
    },

    PaymentCash: function (NumDevice = 0, Amount = 0, CashierName = "") {

      Data = KkmServer.extend({}, KkmServer);
      Data.Command = "PaymentCash";
      Data.NumDevice = NumDevice;
      Data.Amount = Amount;
      Data.CashierName = CashierName;

      return Data;
    },

    GetDataKKT: function (NumDevice = 0) {

      Data = KkmServer.extend({}, KkmServer);
      Data.Command = "GetDataKKT";
      Data.NumDevice = NumDevice;

      return Data;
    },

    GetRezult: function (IdCommand) {

      Data = KkmServer.extend({}, KkmServer);
      Data.Command = "GetRezult";
      Data.IdCommand = IdCommand;

      return Data;
    },

    // Добавление дополнительных свойст чека по умолчанию
    AddDefaultCheckProps: function (Print, PrintInHeader, Teg, Prop) {

      var Data = {
        Print: Print,
        PrintInHeader: PrintInHeader,
        Teg: Teg,
        Prop: Prop
      };

      this.DefaultSettings.CheckProps.push(Data);
      return Data;

    },

    // Добаляет прослушиватель для сканера штрих-кодов
    // Параметр: Fun(Data), где Data - объект: {BarCode, NumDevice, UnitName, AlreadyProcessed}
    //      Где: BarCode - строка, отсканированный штрих-код
    //      Где: NumDevice - строка, номер устройства
    //      Где: UnitName - строка, пользовательское имя устройства
    //      Где: AlreadyProcessed - bool, возвращаемый, если установит в Истина то расширение считает что ШК обработан и не вызывает дальше прослушиватели 
    addEventBarcodeListener: function (Fun) {
      KkmServer._ListBarCodeEvent.add(Fun);
    },

    // Копирование свойств
    extend: function (dest, src, overwrite = true, skip_ = false) {
      for (var i in src) {
        if (skip_ == true && (i.indexOf("_") == 0 || typeof src[i] == "function" || i == "DefaultSettings")) {
          continue;
        };
        if (overwrite == false && dest.hasOwnProperty(i) == true) {
          continue;
        };
        dest[i] = src[i];
      };
      return dest;
    },

    // Герерация GUID
    NewGuid: function () {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      };
      return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },

  };

  // Принимаем выполнение команды от KkmServer
  window.addEventListener("message", function (event) {
    if (event.source != window || event.data.To != "Client") return;
    var IdCommand = event.data.Data.IdCommand;
    if (event.data.Data.Command == "GetRezult") {
      IdCommand = event.data.Data.Rezult.IdCommand + "GetRezult";
    };
    if (KkmServer._QueryResponses.has(IdCommand) == true) {
      try {
        CallBack = KkmServer._QueryResponses.get(IdCommand);
        CallBack(event.data.Data);
        KkmServer._QueryResponses.delete(IdCommand);
      } catch (err) { };
      IsRun = false;
    };
  }, false);

  // Слушаем сообщения о сканировании штрих-кодов
  window.addEventListener("message",
    function (event) {
      if (event.source != window || event.data.name != "kkmserver.addin.EventBarcode") return;
      var AlreadyProcessed = false;
      for (let Fun of KkmServer._ListBarCodeEvent) {
        try {
          var Par = { BarCode: event.data.BarCode, NumDevice: event.data.NumDevice, UnitName: event.data.UnitName, AlreadyProcessed: AlreadyProcessed };
          Fun(Par);
          AlreadyProcessed = Par.AlreadyProcessed;
          if (AlreadyProcessed == true) {
            break;
          };
        } catch (ex) { };
      };
    }
  );

}
//////////////////////////////////////////////////////////
//-СТАРОЕ
//////////////////////////////////////////////////////////


// Выполняет команду на KkmServer
function KkmServer_Execute(Data, CallBack) {

  if ("IdCommand" in Data == false) {
    Data.IdCommand = guid();
  };
  if (Data.IdCommand == "") {
    Data.IdCommand = guid();
  };

  KkmServer._QueryResponses.set(Data.IdCommand, CallBack);

  window.postMessage({ Data: Data, To: "Server" }, "*");

  //window.addEventListener("message", function (event) {
  //    if (event.source != window || event.data.To != "Client") return;
  //    CallBack(event.data.Data);
  //}, false); 

}

// Получение списка устройств
function KkmServer_List() {

  Data = {
    Command: "List",
    NumDevice: 0,
    IdCommand: KkmServer_NewGuid(),
    InnKkm: "",
    Active: null,
    OnOff: null,
    OFD_Error: null,
    OFD_DateErrorDoc: '2100-01-01T00:00:00',
    FN_DateEnd: '2100-01-01T00:00:00',
    FN_MemOverflowl: null,
    FN_IsFiscal: null
  };

  return Data;
}

// Включение/выключение устройства
function KkmServer_OnOffUnut(NumDevice = 0, Active = false) {

  Data = {
    Command: "OnOffUnut",
    NumDevice: NumDevice,
    Active: Active,
    IdCommand: KkmServer_NewGuid(),
  };

  return Data;
}

// Герерация GUID
function KkmServer_NewGuid() {

  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

//////////////////////////////////////////////////////////
//-ККТ----------------------------------------------------
//////////////////////////////////////////////////////////

// Возвращает данные для заполнения чека по ФФД вер. 1.0
function KkmServer_GetDataCheck_1_0(TypeCheck = 0, NumDevice = 0, InnKkm = "", CashierName = "") {

  // Подготовка данных команды
  var Data = {
    VerFFD: "1.0",
    Command: "RegisterCheck",
    NumDevice: NumDevice,
    InnKkm: InnKkm,
    KktNumber: "",
    Timeout: 30,
    IdCommand: KkmServer_NewGuid(),
    IsFiscalCheck: true,
    TypeCheck: TypeCheck,
    CancelOpenedCheck: true,
    NotPrint: false,
    NumberCopies: 0,
    CashierName: CashierName,
    ClientAddress: "",
    TaxVariant: "",
    CheckProps: [],
    AdditionalProps: [],
    KPP: "",
    ClientId: "",
    KeySubLicensing: "",
    CheckStrings: [],
    Cash: 0,
    CashLessType1: 0,
    CashLessType2: 0,
    CashLessType3: 0
  };

  return Data;
}

// Добаляет фискальную строку и возвращает ее для заполнения
function KkmServer_AddRegisterString(DataCheck, Name, Quantity, Price, Amount, Tax, Department, EAN13, SignMethodCalculation, SignCalculationObject, NomenclatureCode, MeasurementUnit) {

  var Data;

  if (DataCheck.VerFFD == "1.0") {
    Data = {
      Register: {
        Name: Name,
        Quantity: Quantity,
        Price: Price,
        Amount: Amount,
        Department: Department,
        Tax: Tax,
        EAN13: EAN13,
        EGAIS: null,
      }
    }
  };

  DataCheck.CheckStrings.push(Data);
  return Data.Register;

}

// Добаляет простую строку и возвращает ее для заполнения
function KkmServer_AddTextString(DataCheck, Text, Font, Intensity) {

  var Data;

  Data = {
    PrintText: {
      Text: Text,
      Font: Font,
      Intensity: Intensity,
    }
  };

  DataCheck.CheckStrings.push(Data);
  return Data.PrintText;

}

// Добаляет данные для печати ШК и возвращает ее для заполнения
function KkmServer_AddBarcodeString(DataCheck, BarcodeType, Barcode) {

  var Data;

  Data = {
    BarCode: {
      BarcodeType: BarcodeType,
      Barcode: Barcode,
    }
  };

  DataCheck.CheckStrings.push(Data);
  return Data.BarCode;

}

// Добаляет данные для печати картинки и возвращает ее для заполнения
function KkmServer_AddImageString(DataCheck, Image) {

  var Data;

  Data = {
    PrintImage: {
      Image: Image,
    },
  };

  DataCheck.CheckStrings.push(Data);
  return Data.PrintImage;

}

//--------------------------------------------------------

function KkmServer_OpenShift(NumDevice = 0, CashierName = "") {

  Data = {
    Command: "OpenShift",
    NumDevice: NumDevice,
    CashierName: CashierName,
    IdCommand: KkmServer_NewGuid(),
  };

  return Data;
}

function KkmServer_ZReport(NumDevice = 0, CashierName = "") {

  Data = {
    Command: "ZReport",
    NumDevice: NumDevice,
    CashierName: CashierName,
    IdCommand: KkmServer_NewGuid(),
  };
  return Data;
}

function KkmServer_XReport(NumDevice = 0) {

  Data = {
    Command: "XReport",
    NumDevice: NumDevice,
    IdCommand: KkmServer_NewGuid(),
  };
  return Data;
}

function KkmServer_OfdReport(NumDevice = 0) {

  Data = {
    Command: "OfdReport",
    NumDevice: NumDevice,
    IdCommand: KkmServer_NewGuid(),
  };
  return Data;
}

function KkmServer_OpenCashDrawer(NumDevice = 0) {

  Data = {
    Command: "OpenCashDrawer",
    NumDevice: NumDevice,
    IdCommand: KkmServer_NewGuid(),
  };
  return Data;
}

function KkmServer_DepositingCash(NumDevice = 0, Amount = 0, CashierName = "") {

  Data = {
    Command: "DepositingCash",
    NumDevice: NumDevice,
    Amount: Amount,
    CashierName: CashierName,
    IdCommand: KkmServer_NewGuid(),
  };
  return Data;
}

function KkmServer_PaymentCash(NumDevice = 0, Amount = 0, CashierName = "") {

  Data = {
    Command: "PaymentCash",
    NumDevice: NumDevice,
    Amount: Amount,
    CashierName: CashierName,
    IdCommand: KkmServer_NewGuid(),
  };
  return Data;
}

function KkmServer_GetDataKKT(NumDevice = 0) {

  Data = {
    Command: "GetDataKKT",
    NumDevice: NumDevice,
    IdCommand: KkmServer_NewGuid(),
  };
  return Data;
}

function KkmServer_GetRezult(IdCommand) {

  Data = {
    Command: "GetRezult",
    IdCommand: IdCommand,
  };
  return Data;
}

//////////////////////////////////////////////////////////
//-ШК-----------------------------------------------------
//////////////////////////////////////////////////////////

// Добаляет прослушиватель для сканера штрих-кодов
// Параметр: Fun(Data), где Data - объект: {BarCode, NumDevice, UnitName, AlreadyProcessed}
//      Где: BarCode - строка, отсканированный штрих-код
//      Где: NumDevice - строка, номер устройства
//      Где: UnitName - строка, пользовательское имя устройства
//      Где: AlreadyProcessed - bool, возвращаемый, если установит в Истина то расширение считает что ШК обработан и не вызывает дальше прослушиватели 
function KkmServer_addEventBarcodeListener(Fun) {
  KkmServer.addEventBarcodeListener(Fun);
}


//////////////////////////////////////////////////////////
//-Вспомогательное----------------------------------------
//////////////////////////////////////////////////////////

// Герерация GUID
function guid() {

  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
