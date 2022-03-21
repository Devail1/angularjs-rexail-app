const checkout = angular.module("checkoutModule", []);

checkout.controller("checkoutController", function ($scope, $http, $location, $rootScope, CURRENCY_SIGN) {
    const ctrl = this;
    ctrl.state = {
        currencySign: CURRENCY_SIGN,
        formControl: {
            cardHolderID: null,
        },
        errors: {
            cardHolderName: null,
            cardHolderID: null,
            cardNumber: null,
            cardExpirationDate: null,
            cardCVV: null,
        },
    }

    ctrl.onValidateFormInput = function (value) {
        if (value === 'card-holder-name') ctrl.state.errors.checkout.cardHolderName = !validateCardHolderName(ctrl.state.formControl.cardHolderName)
        if (value === 'card-holder-id') ctrl.state.errors.checkout.cardHolderID = !validateCardHolderID(ctrl.state.formControl.cardHolderID)
        if (value === 'card-number') ctrl.state.errors.checkout.cardNumber = !validateCardNumber(ctrl.state.formControl.cardNumber)
        if (value === 'card-expiration-date') ctrl.state.errors.checkout.cardExpirationDate = !validateCardExpirationDate(ctrl.state.formControl.cardExpirationDate)
        if (value === 'card-cvv') ctrl.state.errors.checkout.cardCVV = !validateCardCVV(ctrl.state.formControl.cardCVV)
    }

    // Enable or Disable submit checkout button
    ctrl.disableCheckoutForm = function () {
        let formValidations = Object.values(ctrl.state.errors.checkout)

        // checks whether an input form is invalid
        const isNotValid = (inputError) => (inputError === true || inputError === null);

        return formValidations.some(isNotValid)
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