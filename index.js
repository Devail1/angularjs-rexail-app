const rexailApp = angular.module('rexail-app', ['ngRoute']);

rexailApp.config(function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/', {
            templateUrl: 'views/store.html', // controller: 'FirstController'
        })
        .when('/cart', {
            templateUrl: 'views/cart.html', controller: 'appController'
        })
        .when('/checkout', {
            templateUrl: 'views/checkout.html', // controller: 'SecondController'
        })
        .otherwise({
            redirectTo: '/'
        });
})

rexailApp.controller('appController', function ($scope, $http) {
    // Setting s3 imgBaseUrl for cartItem
    $scope.imgBaseUrl = 'https://s3.eu-central-1.amazonaws.com/images-il.rexail.com/';

    function getStoreData() {
         $http.get('https://test.rexail.co.il/client/public/store/website?domain=testeitan.rexail.co.il')
            .then(function (response) {
                $scope.storeData = response.data.data;
            });
    }

    function getProductsData(encryptionKey) {
          $http.get(`https://test.rexail.co.il/client/public/store/catalog?s_jwe=${encryptionKey}`)
            .then(function (response) {
                $scope.productsData = response.data.data;
            });
    }

    async function getData() {
        await getStoreData()
        await getProductsData($scope.storeData.jsonWebEncryption)
    }

    // init Data fetch
    getData();
});


rexailApp.directive('cartItem', function () {
    return {
        templateUrl: 'directives/cart-item.html',
        replace: true,
    }
})


rexailApp.directive('navMenu', function () {
    return {
        templateUrl: 'directives/nav-menu.html', replace: true,
    }
})

// Utils

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
