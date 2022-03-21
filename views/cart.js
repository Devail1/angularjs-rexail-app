const cart = angular.module("cartModule", []);

cart.controller("cartController", function (cartActionsService, CURRENCY_SIGN) {
    const ctrl = this;
    ctrl.state = {
        cartActions: cartActionsService,
        currencySign: CURRENCY_SIGN,
        formControl: {
            userComment: '',
        },
    }
});