define([], function () {
    "use strict";
    function Stocks(scope, element) {
        element.html('<img src="http://chart.finance.yahoo.com/z?s=YNDX&t=1w&q=l&l=on&z=l&c=GOOG&lang=ru-RU" class="centered" style="width:90%;"/>');
    }
    return Stocks;
});

