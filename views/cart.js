const cart = angular.module("cartModule", []);

cart.controller("cartController", function($scope, $http,$rootScope, cartActionsService) {
    const ctrl = this;
    ctrl.state = {
    }

    init();

    function init() {
        ctrl.state.increaseProductQuantity =  function (product) { cartActionsService.increaseProductQuantity(product) }
    }

    console.log(ctrl)
});