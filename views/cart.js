const cart = angular.module("cartModule", []);

cart.controller("cartController", function (cartActionsService, CURRENCY_SIGN, $rootScope, $location) {
    const ctrl = this;
    ctrl.state = {
        cartActions: cartActionsService,
        currencySign: CURRENCY_SIGN,
        formControl: {
            userComment: '',
        },
        errors: {
            productComment: false
        },
    }

    // Cart products required comment validations
    ctrl.onCartSubmit = function () {
        // Getting all products with comments
        let prepProducts = $rootScope.globalState.cartItems.filter(product => product.commentType);
        // Getting all products with selected comment
        let validPrepProducts = prepProducts.filter(product => product.commentType && product.comment)
        // Check if all product's preparation methods are selected
        ctrl.state.errors.productComment = (validPrepProducts.length !== prepProducts.length)

        // Check if user comment is empty
        ctrl.state.errors.userComment = !ctrl.state.formControl.userComment.length

        // Redirect to /checkout if there are no errors
        if (!ctrl.state.errors.userComment && !ctrl.state.errors.productComment) $location.path('/checkout').replace();
    };
});