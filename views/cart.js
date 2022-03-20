const cart = angular.module("cartModule", []);

cart.controller("cartController", function($scope, $http,$rootScope, cartActionsService) {
    const ctrl = this;
    ctrl.state = {
        cartActions: cartActionsService,
        currencySign: CURRENCY_SIGN,
    }
});