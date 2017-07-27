var request_storeland = 0;
function RequestStoreland(r) {
  request_storeland = r;
  if (!request_storeland) {
    return;
  }
  setTimeout(function () {
    console.log('запрос к сторленду');
    $.ajax({
      type: 'get',
      async: true,
      timeout: 20000,
      url: 'http://x209766.storeland.ru/api/kkm_receipts?token=1283471294',
      // url: 'https://storeland.ru/user/is_auth',
      crossDomain: true,
      success: function (e) {
        console.log('удачный ответ от сторленда');
        try {
          var receipt_storeland = JSON.parse(e);
        } catch(err){
          return;
        }
        if(typeof(receipt_storeland.is_auth) != 'undefined'){
          console.log('нет авторизации');
          RequestStoreland(request_storeland);
          return;
        } 
        console.log(receipt_storeland);
        if(receipt_storeland.length === 0 || typeof(receipt_storeland[0].uuid) === 'undefined'){
          console.log('нет чеков');
          RequestStoreland(request_storeland);
          return;
        }
        console.log('распарсили ответ от сторленда');
        console.log('запрос на смену статуса чека сторленду');
        $.ajax({
          type: 'get',
          async: true,
          timeout: 20000,
          url: 'http://x209766.storeland.ru/api/kkm_receipts?token=1283471294&receipt_token='+receipt_storeland[0].uuid+'&status=1',
          crossDomain: true,
          success: function (e) {
            console.log('удачный ответ на смену статуса');
            var response = JSON.parse(e);
            //печать чека только в случае смены статуса на "печатается"
            if(typeof(response.status) != 'undefined' && response.status == 'ok'){
              var receipt_type = {'sell': 0, 'sell_refund': 1};
              console.log('печать чека');
              console.log(receipt_storeland);
              console.log(DefaultKkt);
              RegisterCheck(receipt_storeland[0], DefaultKkt, typeof(receipt_type[receipt_storeland[0].type]) != 'undefined' ? receipt_type[receipt_storeland[0].type] : 0, true);
            }
          },
          error: function (error) {
            console.log(error);
            print_mess([{'id':'Responce', 'text':'статус чека на storeland не удалось сменить'}]);
          }
        });
        if(request_storeland) request_storeland = 5000;
        RequestStoreland(request_storeland);
      },
      error: function (error) {
        //меняем задержку для следующего запроса. так как сервер сторленда не ответил и нет смысла его долбить часто
        console.log(error);
        if(request_storeland) request_storeland = 25000;
        RequestStoreland(request_storeland);
      }
    });
  }, request_storeland);
}

function print_mess(errors){
  for(var err in errors){
    $('#'+err.id).html(err.text);
  }
}

function play() {
  if ($('#play').data('value')) {
    $('#play').data('value', 0).text('стоп');
    RequestStoreland(5000);
  } else {
    $('#play').data('value', 1).text('старт');
    RequestStoreland(0);
  }
}

window.onload = function () {
  document.getElementById('sendCheck').addEventListener('click', RegisterBuy);
  document.getElementById('sendCheckRefund').addEventListener('click', RegisterBuyRefund);
  document.getElementById('openShift').addEventListener('click', OpenShift);
  document.getElementById('ZReport').addEventListener('click', ZReport);
  document.getElementById('play').addEventListener('click', play);
};

function RegisterBuy() {
  RegisterCheck({}, DefaultKkt, 0, true);
}

function RegisterBuyRefund() {
  RegisterCheck({}, DefaultKkt, 1, true);
}

function OpenShift() {
  ExecuteCommand(
    KkmServer.OpenShift(DefaultKkt, DefaultCashierName),
    (Server + ((Server == "") ? window.location.protocol + "//" + window.location.host + "/" : "/") + 'Execute'),
    undefined,
    ExecuteSuccess,
    ErrorSuccess);
}

function ZReport() {
  ExecuteCommand(
    KkmServer.ZReport(DefaultKkt, DefaultCashierName),
    (Server + ((Server == "") ? window.location.protocol + "//" + window.location.host + "/" : "/") + 'Execute'),
    undefined,
    ExecuteSuccess,
    ErrorSuccess);
}

// Печать чеков
function RegisterCheck(receipt_storeland, NumDevice, TypeCheck, IsBarCode) {
  // NumDevice Номер устройства. Если 0 то первое не блокированное на сервере
  var Data = KkmServer.GetDataCheck_1_0(TypeCheck, NumDevice, "", DefaultCashierName);
  // Команда серверу
  Data.Command = "RegisterCheck",
    // Время (сек) ожидания выполнения команды.
    //Если За это время команда не выполнилась в статусе вернется результат "NotRun" или "Run"
    //Проверить результат еще не выполненной команды можно командой "GetRezult"
    //Если не указано или 0 - то значение по умолчанию 60 сек.
    // Поле не обязательно. Это поле можно указывать во всех командах
    Data.Timeout = 30;
  // Уникальный идентификатор команды. Любая строка из 40 символов - должна быть уникальна для каждой подаваемой команды
  // По этому идентификатору можно запросить результат выполнения команды
  // Поле не обязательно
  if (!$.isEmptyObject(receipt_storeland)) {
    // Data.IdCommand = KkmServer.NewGuid(),
    Data.IdCommand = receipt_storeland.uuid,
      // Это фискальный или не фискальный чек
      Data.IsFiscalCheck = true,
      // Аннулировать открытый чек если ранее чек не был  завершен до конца
      Data.CancelOpenedCheck = true,
      // Не печатать чек на бумагу
      Data.NotPrint = false,
      // Телефон или е-Майл покупателя, тег ОФД 1008
      // Если чек не печатается (NotPrint = true) то указывать обязательно
      Data.ClientAddress = typeof(receipt_storeland.receipt.attributes.email) != 'undefined' ? receipt_storeland.receipt.attributes.email : receipt_storeland.receipt.attributes.phone,
      // Система налогообложения (СНО) применяемая для чека
      // Если не указанно - система СНО настроенная в ККМ по умолчанию
      // 0: Общая ОСН
      // 1: Упрощенная УСН (Доход)
      // 2: Упрощенная УСН (Доход минус Расход)
      // 3: Единый налог на вмененный доход ЕНВД
      // 4: Единый сельскохозяйственный налог ЕСН
      // 5: Патентная система налогообложения
      // Комбинация разных СНО не возможна
      // Надо указывать если ККМ настроена на несколько систем СНО
      Data.TaxVariant = typeof(receipt_storeland.tax) != 'undefined' ? receipt_storeland.tax : 1,
      // Дополниельные реквизиты чека (не обязательно):
      //1005 Адрес оператора по переводу денежных средств (Строка 100)
      //1016 ИНН оператора по переводу денежных средств (Строка 12)
      //1026 Наименование оператора по переводу денежных средств (Строка 64)
      //1044 Операция банковского агента (Строка 24)
      //1045 Операция банковского субагента (Строка 24)
      //1073 Телефон банковского агента (Строка 19)
      //1074 Телефон платежного агента (Строка 19)
      //1075 Телефона оператора по переводу денежных средств (Строка 19)
      //1082 Телефон банковского субагента (Строка 19)
      //1083 Телефон платежного субагента (Строка 19)
      //1119 Телефон оператора по приему платежей (Строка 19)
      //1117 адрес электронной почты отправителя чека
      // CheckProps: [
      //   { Print: true, PrintInHeader: true, Teg: 1005, Prop: "Москва, ул. Трехгорка д.13" },
      //   { Print: true, PrintInHeader: true, Teg: 1073, Prop: "8(985)775-44-61" },
      //   { Print: true, PrintInHeader: true, Teg: 1117, Prop: "client@server.ru" },
      // ],
      // Дополнительные произвольные реквизиты (не обязательно) пока только 1 строка
      // Data.AdditionalProps = [
      //   //{ Print: true, PrintInHeader: false, NameProp: "Номер транзакции", Prop: "234/154" },
      //   {Print: true, PrintInHeader: false, NameProp: "Дата транзакции", Prop: "10.11.2016 10:30"},
      // ],
      // Это только для тестов:
      // ClientId: "23FG4GV4D2956",
      Data.ClientId = "e1e0c5dbb395acecda9e3ed86a798755b21a53de";
    var taxes = {'none': 0, 'vat0': 0, 'vat10': 110, 'vat18': 118};
    receipt_storeland.receipt.items.forEach(function (item, i) {
      Data.CheckStrings[i] = {
        Register: {
          // Наименование товара 64 символа
          Name: item.name,
          // Количество товара
          Quantity: item.quantity,
          // Цена за шт. без скидки
          Price: item.price + item.tax_sum,
          // Конечная сумма строки с учетом всех скидок/наценок;
          Amount: item.price,
          // Отдел, по которому ведется продажа
          Department: 1,
          // НДС в процентах или ТЕГ НДС: 0 (НДС 0%), 10 (НДС 10%), 18 (НДС 18%), -1 (НДС не облагается), 118 (НДС 18/118), 110 (НДС 10/110)
          Tax: taxes[item.tax]
        },
      };
    });
    // Наличная оплата
    Data.Cash = 0,
      // Безналичная оплата типа 1 (по умолчанию - Оплата картой)
      Data.CashLessType1 = receipt_storeland.receipt.payments[0].sum,
      // Безналичная оплата типа 2 (по умолчанию - Оплата кредитом)
      Data.CashLessType2 = 0,
      // Безналичная оплата типа 3 (по умолчанию - Оплата сертификатом)
      Data.CashLessType3 = 0;

    //Если чек без ШК то удаляем строку с ШК
    if (IsBarCode == false) {
      //Data.Cash = 100;
      for (var i = 0; i < Data.CheckStrings.length; i++) {
        if (Data.CheckStrings[i] != undefined && Data.CheckStrings[i].BarCode != undefined) {
          Data.CheckStrings[i].BarCode = null;
        }
        if (Data.CheckStrings[i] != undefined && Data.CheckStrings[i].PrintImage != undefined) {
          Data.CheckStrings[i].PrintImage = null;
        }
      }
    }
  } else {
    Data.IdCommand = KkmServer.NewGuid(),
      Data.IsFiscalCheck = true,
      Data.CancelOpenedCheck = true,
      Data.NotPrint = false,
      Data.ClientAddress = "sample@ya.ru",
      Data.TaxVariant = 1,
      Data.AdditionalProps = [
        {Print: true, PrintInHeader: false, NameProp: "Дата транзакции", Prop: "10.11.2016 10:30"},
      ],
      Data.ClientId = "e1e0c5dbb395acecda9e3ed86a798755b21a53de",
      Data.CheckStrings = [
        {
          Register: {
            Name: "Квадрокоптер DF-3099-1",
            Quantity: 50,
            Price: 100,
            Amount: 500.00,
            Department: 1,
            Tax: 118
          },
        },
        {
          Register: {
            Name: "Квадрокоптер DF-3099-1",
            Quantity: 50,
            Price: 100,
            Amount: 500.00,
            Department: 1,
          },
        },
      ],
      // Наличная оплата
      Data.Cash = 0,
      // Безналичная оплата типа 1 (по умолчанию - Оплата картой)
      Data.CashLessType1 = 1000,
      // Безналичная оплата типа 2 (по умолчанию - Оплата кредитом)
      Data.CashLessType2 = 0,
      // Безналичная оплата типа 3 (по умолчанию - Оплата сертификатом)
      Data.CashLessType3 = 0;

    //Если чек без ШК то удаляем строку с ШК
    if (IsBarCode == false) {
      //Data.Cash = 100;
      for (var i = 0; i < Data.CheckStrings.length; i++) {
        if (Data.CheckStrings[i] != undefined && Data.CheckStrings[i].BarCode != undefined) {
          Data.CheckStrings[i].BarCode = null;
        }
        if (Data.CheckStrings[i] != undefined && Data.CheckStrings[i].PrintImage != undefined) {
          Data.CheckStrings[i].PrintImage = null;
        }
      }
    }

  }
  // Вызов команды
  ExecuteCommand(Data, (Server + ((Server == "") ? window.location.protocol + "//" + window.location.host + "/" : "/") + 'Execute'), undefined, ExecuteSuccess, ErrorSuccess);

  // Возвращается JSON:
  //{
  //    "CheckNumber": 1,    // Номер документа
  //    "SessionNumber": 23, // Номер смены
  //    "LineLength": -1,
  //    "URL": "t=20170115T154700&s=0.01&fn=99078900002287&i=118&fp=549164494&n=1", // URL проверки чека, где: t-дата-время, s-сумма документа, fn-номер ФН, i-номер документа, fp-фискальная подпись, n-тип документа
  //    "Info": null,
  //    "Command": "RegisterCheck",
  //    "Error": "",  // Текст ошибки если была - обязательно показать пользователю - по содержанию ошибки можно в 90% случаях понять как ее устранять
  //    "Status": 0   // Ok = 0, Run(Запущено на выполнение) = 1, Error = 2, NotFound(устройство не найдено) = 3, NotRun = 4
  //}

}

// Функция вызываемая после обработки команды - обработка возвращаемых данных
function ExecuteSuccess(Rezult, textStatus, jqXHR) {
  if(Rezult.Status === 5 || Rezult.Status === 0){
    $.ajax({
      type: 'post',
      async: true,
      timeout: 20000,
      url: 'http://x209766.storeland.ru/api/kkm_receipts?token=1283471294&receipt_token='+Rezult.IdCommand+'&status=2',
      crossDomain: true,
      data: Rezult.Status === 0 ? {'advanced': JSON.stringify(Rezult)} : {},
      success: function (e) {
        console.log('удачный ответ на смену статуса');
        var response = JSON.parse(e);
        //печать чека только в случае смены статуса на "печатается"
        if(typeof(response.status) !== 'undefined' && response.status === 'ok'){
          console.log('чек напечатан');          
        }
      },
      error: function (error) {
        console.log(error);
        print_mess([{'id':'Responce', 'text':'статус чека на storeland не удалось сменить'}]);
      }
    });
    
  }
  console.log(Rezult);
}

// Функция вызываемая при ошибке передачи данных
function ErrorSuccess(jqXHR, textStatus, errorThrown) {
  console.log("nen2!!!");
  console.log(jqXHR);
  console.log(textStatus);
  console.log(errorThrown);
  // document.getElementById('Responce').innerHTML = "Ошибка передачи данных по HTTP протоколу: " + errorThrown;
  //$('.Responce').html("Ошибка передачи данных по HTTP протоколу");
}

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
      }
      ;

      if (funCallBack == undefined) {
        funCallBack = this.DefaultSettings.funCallBack;
      }
      ;
      if (Data.IdCommand == undefined) {
        Data.IdCommand = this.NewGuid();
      }
      ;
      if (Data.Timeout == undefined) {
        Data.Timeout = this.DefaultSettings.Timeout;
      }
      ;
      if (Data.KeySubLicensing == undefined && this.DefaultSettings.KeySubLicensing != "") {
        Data.KeySubLicensing = this.DefaultSettings.KeySubLicensing;
      }
      ;
      if (Data.Command == "" || Data.Command == undefined) {
        funCallBack({
          Command: "<Не указано>",
          Error: "Ошибка вызова: не заполнена команда",
          Status: 2,
          IdCommand: Data.IdCommand,
        });
        return this;
      }
      ;
      if (Data.Command == "GetRezult") {
        KkmServer._QueryResponses.set(Data.IdCommand + "GetRezult", funCallBack);
      } else {
        KkmServer._QueryResponses.set(Data.IdCommand, funCallBack);
      }
      ;
      window.postMessage({Data: Data, To: "Server"}, "*");

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
      }
      ;

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
        }
        ;
        if (overwrite == false && dest.hasOwnProperty(i) == true) {
          continue;
        }
        ;
        dest[i] = src[i];
      }
      ;
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
    }
    ;
    if (KkmServer._QueryResponses.has(IdCommand) == true) {
      try {
        CallBack = KkmServer._QueryResponses.get(IdCommand);
        CallBack(event.data.Data);
        KkmServer._QueryResponses.delete(IdCommand);
      } catch (err) {
      }
      ;
      IsRun = false;
    }
    ;
  }, false);

  // Слушаем сообщения о сканировании штрих-кодов
  window.addEventListener("message",
    function (event) {
      if (event.source != window || event.data.name != "kkmserver.addin.EventBarcode") return;
      var AlreadyProcessed = false;
      for (let Fun of KkmServer._ListBarCodeEvent) {
        try {
          var Par = {
            BarCode: event.data.BarCode,
            NumDevice: event.data.NumDevice,
            UnitName: event.data.UnitName,
            AlreadyProcessed: AlreadyProcessed
          };
          Fun(Par);
          AlreadyProcessed = Par.AlreadyProcessed;
          if (AlreadyProcessed == true) {
            break;
          }
          ;
        } catch (ex) {
        }
        ;
      }
      ;
    }
  );

}
