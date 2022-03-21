const rexailApp = angular.module('rexail-app', ['ngRoute', 'infinite-scroll', 'storeModule', 'cartModule', 'checkoutModule']);

// Constants
rexailApp.constant('IMG_BASE_URL', 'https://s3.eu-central-1.amazonaws.com/images-il.rexail.com/');
rexailApp.constant('CURRENCY_SIGN', '₪');

// Routes
rexailApp.config(function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

    $routeProvider
        .when('/store', {
            templateUrl: 'views/store.html',
            controller: 'storeController',
            controllerAs: 'ctrl'

        })
        .when('/cart', {
            templateUrl: 'views/cart.html',
            controller: 'cartController',
            controllerAs: 'ctrl'
        })
        .when('/checkout', {
            templateUrl: 'views/checkout.html',
            controller: 'checkoutController',
            controllerAs: 'ctrl'
        })
        .otherwise({
            redirectTo: '/store'
        });
})

// Initialization
rexailApp.run(function ($rootScope, $http, $location, IMG_BASE_URL) {
    $rootScope.globalState = {
        storeData: {},
        categoriesData: [],
        cartItems: [],
        cartTotal: '0.00',
        searchQuery: '',
        getCurrentPath: function () {
            return $location.path();
        }
    }

    function fetchAppData() {
        $http.get('https://test.rexail.co.il/client/public/store/website?domain=testeitan.rexail.co.il')
            .then(function (response) {
                // Loading store data to root scope
                $rootScope.globalState.storeData = response.data.data;
                $http.get(`https://test.rexail.co.il/client/public/store/catalog?s_jwe=${$rootScope.globalState.storeData.jsonWebEncryption}`)
                    .then(function (response) {
                        // Formatting data products by categories
                        $rootScope.globalState.categoriesData = formatData(response.data.data);
                        // Setting initial category
                        $rootScope.globalState.selectedCategory = $rootScope.globalState.categoriesData[0]
                    });
            });
    }

    fetchAppData();

    function formatData(array) {
        return Object.values(array.reduce((obj, current) => {
            if (!obj[current.productCategory.id]) {
                obj[current.productCategory.id] = {
                    id: current.productCategory.id,
                    name: current.productCategory.name,
                    children: []
                }
            }

            // If there is no primary quantity unit than use the first product selling unit.
            let primaryQuantityUnit = !current.product.primaryQuantityUnit && current.productSellingUnits[0]

            let productModel = {
                id: current.id,
                name: current.product.name,
                fullName: current.fullName,
                imageUrl: IMG_BASE_URL.concat(current.imageUrl),
                price: current.price,
                promoted: current.promoted,
                originalPrice: current.originalPrice,
                productQuality: current.productQuality,
                currentRelevancy: current.currentRelevancy,
                primaryQuantityUnit: current.primaryQuantityUnit ? current.primaryQuantityUnit : current.productSellingUnits[0],
                productSellingUnits: current.productSellingUnits,
                commentType: current.commentType
            }

            // Push to all products category
            if (current.product.id) obj['0'].children.push(productModel)
            // Push to promoted products category
            if (current.promoted) obj['1'].children.push(productModel)

            // Continue reformatting
            obj[current.productCategory.id].children.push(productModel)

            return obj
        }, {
            // Initial state manually with default categories
            0: {id: 0, name: 'כל המוצרים', children: []}, 1: {id: 1, name: 'מבצעים', children: []}
        }));
    }
})

// Services
rexailApp.service('cartActionsService', function ($rootScope) {
    const ctrl = this;

    ctrl.onIncreaseProductQuantity = function (product) {
        if (!product.quantity || product.quantity < product.primaryQuantityUnit.maxAmount) {
            product.quantity = product.quantity ? product.quantity + product.primaryQuantityUnit.sellingUnit.amountJumps : product.primaryQuantityUnit.sellingUnit.amountJumps;
            !$rootScope.globalState.cartItems.includes(product) && $rootScope.globalState.cartItems.unshift(product)
            $rootScope.globalState.cartTotal = this.calculateTotal();
        }
    }

    ctrl.onDecreaseProductQuantity = function (product) {
        if (product.quantity > product.primaryQuantityUnit.sellingUnit.amountJumps) {
            product.quantity = product.quantity - product.primaryQuantityUnit.sellingUnit.amountJumps
            !$rootScope.globalState.cartItems.includes(product) && $rootScope.globalState.cartItems.unshift(product)
        } else this.onRemoveProduct(product)
        $rootScope.globalState.cartTotal = this.calculateTotal();
    }

    ctrl.onRemoveProduct = function (product) {
        product.quantity = null
        $rootScope.globalState.cartItems = $rootScope.globalState.cartItems.filter(item => item.id !== product.id)
        $rootScope.globalState.cartTotal = this.calculateTotal();
    }

    ctrl.onClearCart = function () {
        $rootScope.globalState.cartItems.forEach(item => item.quantity = null)
        $rootScope.globalState.cartItems = []
        $rootScope.globalState.cartTotal = this.calculateTotal();
    }

    ctrl.calculateTotal = function () {
        const initialValue = 0;
        const sumWithInitial = $rootScope.globalState.cartItems.reduce((totalSum, product) => totalSum + product['price'] * product.quantity, initialValue)
        return sumWithInitial.toFixed(2)
    }
})

// Controllers
rexailApp.controller('productController', function (CURRENCY_SIGN) {
    const ctrl = this;

    ctrl.currencySign = CURRENCY_SIGN

    ctrl.onUnitTypeChange = function (product, quantityUnit) {
        // Check the new unit weight and modify the price accordingly, if the new unit weight is higher, than multiply the price by it,
        // else, divide the price by the previous unit weight value, do the same for old price.
        if (product.primaryQuantityUnit.estimatedUnitWeight < quantityUnit.estimatedUnitWeight) {
            product.price = (product.price * quantityUnit.estimatedUnitWeight).toFixed(2)
            if (product.originalPrice) {
                product.originalPrice = (product.originalPrice * quantityUnit.estimatedUnitWeight).toFixed(2)
            }
        } else if (product.primaryQuantityUnit.estimatedUnitWeight !== quantityUnit.estimatedUnitWeight) {
            product.price = (product.price / product.primaryQuantityUnit.estimatedUnitWeight).toFixed(2)
            if (product.originalPrice) {
                product.originalPrice = (product.originalPrice / product.primaryQuantityUnit.estimatedUnitWeight).toFixed(2)
            }
        }

        // Assign to product the new quantity unit
        product.primaryQuantityUnit = quantityUnit

        // Convert float to int if unit type is not supporting floats
        if (product.primaryQuantityUnit.sellingUnit.amountJumps === 1) {
            product.quantity = product.quantity < 1 ? Math.round(product.quantity) : Math.floor(product.quantity)
        }

        // Update product's quantity based on unit type max amount
        if (product.quantity > product.primaryQuantityUnit.maxAmount) {
            product.quantity = product.primaryQuantityUnit.maxAmount
        }
    }
})

// Directives
rexailApp.directive('storeItem', function () {
    return {
        templateUrl: 'directives/store-item.html',
        replace: true,
        scope: {
            product: '=',
            onIncreaseProductQuantity: '&',
            onDecreaseProductQuantity: '&',
        },
        controller: 'productController',
        controllerAs: 'ctrl',
    }
})

rexailApp.directive('itemPreview', function () {
    return {
        templateUrl: 'directives/item-preview.html',
        replace: true,
        scope: {
            product: '=',
            onRemoveProduct: '&',
            onIncreaseProductQuantity: '&',
            onDecreaseProductQuantity: '&'
        },
        controller: 'productController',
        controllerAs: 'ctrl',
    }
})

rexailApp.directive('cartItem', function () {
    return {
        templateUrl: 'directives/cart-item.html',
        replace: true,
        scope: {
            product: '=',
            onIncreaseProductQuantity: '&',
            onDecreaseProductQuantity: '&',
            onRemoveProduct: '&',
        },
        controller: 'productController',
        controllerAs: 'ctrl',
    }
})

rexailApp.directive('footerMenu', function () {
    return {
        templateUrl: 'directives/footer-menu.html',
        replace: true,
    }
})

rexailApp.directive('navMenu', function () {
    return {
        templateUrl: 'directives/header-menu.html',
        replace: true,
    }
})