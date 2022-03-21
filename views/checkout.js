const checkout = angular.module("checkoutModule", []);

checkout.controller("checkoutController", function ($http, $location, $rootScope, CURRENCY_SIGN) {
    const ctrl = this;
    ctrl.state = {
        currencySign: CURRENCY_SIGN,
        shouldSaveCardInfoCheckbox: true,
        formControl: {
            cardHolderID: null,
            cardHolderName: null,
            cardHolderID: null,
            cardNumber: null,
            cardExpDate: null,
            cardCVV: null
        },
    }

    ctrl.addSlashExp = function () {
        let expire_date = document.getElementById('exp').value;
        if (expire_date.length == 2) {
            document.getElementById('exp').value = expire_date + '/';
        }
    }

    // Convert str to num expression in order to use in template
    ctrl.parseFloat = parseFloat;
});