const cart = angular.module("cartModule", []);

cart.controller("cartController", function (cartActionsService, CURRENCY_SIGN, $rootScope, $location) {
    const ctrl = this;
    ctrl.state = {
        cartActions: cartActionsService,
        currencySign: CURRENCY_SIGN,
        formControl: {
            userComment: '',
        },
    }

    // Compare all products with required comments to all products with selected comment
    ctrl.disableCartSubmit = function () {
        let prepProducts = $rootScope.globalState.cartItems.filter(product => product.commentType);
        let validPrepProducts = prepProducts.filter(product => product.commentType && product.comment)

        return (validPrepProducts.length !== prepProducts.length)
    };
});