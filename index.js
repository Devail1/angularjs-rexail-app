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
        cartItems: [], total: null, userComment: '', selectedCategory: null, data: {
            storeData: [], categoriesData: []
        }, errors: {
            userComment: false, prepSelect: false
        }
    }

    // Get data using http service
    $http.get('https://test.rexail.co.il/client/public/store/website?domain=testeitan.rexail.co.il')
        .then(function (response) {
            ctrl.state.data.storeData = response.data.data;
            $http.get(`https://test.rexail.co.il/client/public/store/catalog?s_jwe=${ctrl.state.data.storeData.jsonWebEncryption}`)
                .then(function (response) {
                    // Formatting data products by categories
                    ctrl.state.data.categoriesData = formatData(response.data.data);
                    // Setting initial category
                    ctrl.state.selectedCategory = ctrl.state.data.categoriesData[0]
                });
        });


    ctrl.showMoreCategories = function () {
        return ctrl.state.data.categoriesData.length > 10
    }

    ctrl.handleCategoryClick = function (category) {
        // console.log(category)
        ctrl.state.selectedCategory = category
        console.log(ctrl.state.selectedCategory)
    }

    ctrl.increaseProductQuantity = function (product) {
        console.log(product)
        if (product.product) product = product.product
        product.quantity = product.quantity ? product.quantity + product.defaultSellingUnit.amountJumps : product.defaultSellingUnit.amountJumps;
        !ctrl.state.cartItems.includes(product) && ctrl.state.cartItems.push(product)
    }

    ctrl.decreaseProductQuantity = function (product) {
        console.log(product)
        if (product.quantity > product.defaultSellingUnit.amountJumps) product.quantity = product.quantity - product.defaultSellingUnit.amountJumps
        !ctrl.state.cartItems.includes(product) && ctrl.state.cartItems.push(product)
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
        templateUrl: 'directives/cart-item.html', replace: true,
    }
})


rexailApp.directive('storeItem', function () {
    return {
        templateUrl: 'directives/store-item.html', replace: true, scope: {
            product: '=', imgUrl: '=', increaseProductQuantity: '&', decreaseProductQuantity: '&'
        }
    }
})

rexailApp.directive('footer', function () {
    return {
        templateUrl: 'directives/footer.html', replace: true,
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
                id: current.productCategory.id, name: current.productCategory.name, children: []
            }
        }

        let productModel = {
            id: current.product.id,
            name: current.product.name,
            fullName: current.fullName,
            defaultSellingUnit: current.product.defaultSellingUnit,
            imageUrl: current.imageUrl,
            productSellingUnits: current.productSellingUnits,
            price: current.price,
            promoted: current.promoted,
            oldPrice: current.oldPrice,
            originalPrice: current.originalPrice,
            productQuality: current.productQuality,
            currentRelevancy: current.currentRelevancy
        }

        if (current.product.id) obj['0'].children.push(productModel)
        if (current.promoted) obj['1'].children.push(productModel)

        obj[current.productCategory.id].children.push(productModel)

        return obj
    }, {
        0: {id: 0, name: 'כל המוצרים', children: []},
        1: {id: 1, name: 'מבצעים', children: []}
    }))
}