const rexailApp = angular.module('rexail-app', ['ngRoute', 'infinite-scroll']);

rexailApp.config(function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/store', {
            templateUrl: 'views/store.html',
        })
        .when('/cart', {
            templateUrl: 'views/cart.html', controller: 'appController'
        })
        .when('/checkout', {
            templateUrl: 'views/checkout.html', // controller: 'SecondController'
        })
        .otherwise({
            redirectTo: '/store'
        });
})

rexailApp.controller('appController', function ($http, $scope) {
    const ctrl = this;
    ctrl.state = {
        total: null,
        userComment: '',
        selectedCategory: {'id': 0, name: 'כל המוצרים'},
        data: {
            storeData: [],
            productsData: []
        },
        errors: {
            userComment: false,
            prepSelect: false
        }
    }

    // Get data using http service
    $http.get('https://test.rexail.co.il/client/public/store/website?domain=testeitan.rexail.co.il')
        .then(function (response) {
            ctrl.state.data.storeData = response.data.data;
            $http.get(`https://test.rexail.co.il/client/public/store/catalog?s_jwe=${ctrl.state.data.storeData.jsonWebEncryption}`)
                .then(function (response) {
                    ctrl.state.data.productsData = response.data.data
                    ctrl.state.data.categoriesData = formatData(response.data.data);
                });
        });

    ctrl.shouldRenderPromoted = function () {
        let expression = ctrl.state.data.productsData.find(product => product.promoted) !== undefined
        return expression
    }

    ctrl.showMoreCategories = function () {
        return ctrl.state.data.productsData.length > 10
    }

    ctrl.handleCategoryClick = function (category) {
        ctrl.state.selectedCategory = category
        console.log(ctrl)
    }

    // Setting imgBaseUrl
    ctrl.imgBaseUrl = 'https://s3.eu-central-1.amazonaws.com/images-il.rexail.com/'

    // Setting initial value for pagination limit (infinite scroll)
    $scope.paginationLimit = 20
    $scope.loadMore = function () {
        $scope.paginationLimit = $scope.paginationLimit + 10
    }
})

rexailApp.directive('cartItem', function () {
    return {
        templateUrl: 'directives/cart-item.html',
        replace: true,
    }
})


rexailApp.directive('storeItem', function () {
    return {
        templateUrl: 'directives/store-item.html',
        replace: true,
        scope: {
            id: '=',
            name: '=',
            defaultSellingUnit: '=',
            product: '=',
            imgUrl: '='
        }
    }
})

rexailApp.directive('footer', function () {
    return {
        templateUrl: 'directives/footer.html',
        replace: true,
    }
})

rexailApp.directive('navMenu', function () {
    return {
        templateUrl: 'directives/nav-menu.html', replace: true,
    }
})

// Util Functions
function formatData(array) {
    return Object.values(array.reduce((obj, current) => {
        if (!obj[current.productCategory.id]) {
            obj[current.productCategory.id] = {
                id: current.productCategory.id,
                name: current.productCategory.name,
                children: []
            }
        }

        obj[current.productCategory.id].children.push({
            id: current.product.id,
            name: current.product.name,
            defaultSellingUnit: current.product.defaultSellingUnit,
            imageUrl: current.imageUrl,
            productSellingUnits: current.productSellingUnits,
            price: current.price,
            promoted: current.promoted,
            oldPrice: current.oldPrice,
            originalPrice: current.originalPrice,
            productQuality: current.productQuality
        })

        return obj
    }, {}))
}