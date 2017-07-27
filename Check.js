//var IdAppChrom = "mjeeklofjbnodnnfibjolokichkhcpog";
//var IdAppOpera = "dkbekbmeodgkglklclonfbglkbglinlm";
//var IdAppFirefox = "f0fc9992-333c-4f09-8b33-f56bc9f3131a";


//
chrome.runtime.onConnect.addListener(
//
//

    function (Port) {
        if (Port.name == "kkmserver.addin") {
            Port.onMessage.addListener(
                function (message, Port) {
                    if (Port.sender != undefined && Port.sender != null && "id" in Port.sender
                        //&& (Port.sender.id == IdAppChrom || Port.sender.id == dicmcdllbjghbbmbjofnhmddkcpomghg || Port.sender.id == IdAppFirefox)
                    ) {
                        if (message.Command == "kkmserver.addin.ShowChek") {
                            document.getElementsByTagName('html')[0].innerHTML = message.html;
                        };
                    };
                }
            );
        };
    }
);
