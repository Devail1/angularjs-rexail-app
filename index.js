const rexailApp = angular.module('rexail-app', ['ngRoute', 'infinite-scroll', 'storeModule', 'cartModule', 'checkoutModule']);

rexailApp.constant('IMG_BASE_URL', 'https://s3.eu-central-1.amazonaws.com/images-il.rexail.com/');
rexailApp.constant('CURRENCY_SIGN', '₪');

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

rexailApp.controller('appController', function ($rootScope, $http, $filter, $location, $anchorScroll, IMG_BASE_URL) {
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


rexailApp.controller('productController', function (CURRENCY_SIGN) {
    const ctrl = this;

    ctrl.currencySign = CURRENCY_SIGN

    ctrl.onUnitTypeChange = function (product, quantityUnit) {
        // Check the new unit weight and modify the price accordingly, if the new unit weight is higher, than multiply the price by it,
        // else, divide the price by the previous unit weight value.
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

// components
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
                errors: '=',
            },
            controller: 'productController',
            controllerAs: 'ctrl',
        }
    })

    rexailApp.directive('footerMenu', function () {
        return {
            templateUrl: 'directives/footer-menu.html', replace: true,
        }
    })

    rexailApp.directive('navMenu', function () {
        return {
            templateUrl: 'directives/header-menu.html',
            replace: true,


        }
    })

//
// function formatData(array) {
//     return Object.values(array.reduce((obj, current) => {
//         if (!obj[current.productCategory.id]) {
//             obj[current.productCategory.id] = {
//                 id: current.productCategory.id,
//                 name: current.productCategory.name,
//                 children: []
//             }
//         }
//
//         // If there is no primary quantity unit than use the first product selling unit.
//         let primaryQuantityUnit = !current.product.primaryQuantityUnit && current.productSellingUnits[0]
//
//         let productModel = {
//             id: current.id,
//             name: current.product.name,
//             fullName: current.fullName,
//             imageUrl: current.imageUrl,
//             price: current.price,
//             promoted: current.promoted,
//             originalPrice: current.originalPrice,
//             productQuality: current.productQuality,
//             currentRelevancy: current.currentRelevancy,
//             primaryQuantityUnit: current.primaryQuantityUnit ? current.primaryQuantityUnit : current.productSellingUnits[0],
//             productSellingUnits: current.productSellingUnits,
//             commentType: current.commentType
//         }
//
//         // Push to all products category
//         if (current.product.id) obj['0'].children.push(productModel)
//         // Push to promoted products category
//         if (current.promoted) obj['1'].children.push(productModel)
//
//         // Continue reformatting
//         obj[current.productCategory.id].children.push(productModel)
//
//         return obj
//     }, {
//         // Initial state manually with default categories
//         0: {id: 0, name: 'כל המוצרים', children: []}, 1: {id: 1, name: 'מבצעים', children: []}
//     }))
// }

// Regex Util Functions (copied from regex101 library)
    function validateCardHolderID(IDnum) {
        if (!IDnum) return false
        if (IDnum.length < 9) {
            while (IDnum.length < 9) {
                IDnum = '0' + IDnum;
            }
        }

        let id = String(IDnum).trim();
        if ((id.length > 9) || (id.length < 5)) return false;
        if (isNaN(id)) return false;

        return Array.from(id, Number).reduce((counter, digit, i) => {
            const step = digit * ((i % 2) + 1);
            return counter + (step > 9 ? step - 9 : step);
        }) % 10 === 0;
    }

    function validateCardHolderName(string) {
        const validate = /^[a-zA-Z\u0590-\u05FF\u200f\u200e]([-']?[a-zA-Z\u0590-\u05FF\u200f\u200e]+)*( [a-zA-Z\u0590-\u05FF\u200f\u200e]([-']?[a-zA-Z\u0590-\u05FF\u200f\u200e]+)*)+$/;
        return validate.test(string);
    }

    function validateCardNumber(value) {
        if (!value) return false
        let string = value.trim()
        const validate = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}(?:2131|1800|35\d{3})\d{11})$/;
        return validate.test(string);
    }

    function validateCardExpirationDate(value) {
        let string = String(value)
        const validate = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
        return validate.test(string);
    }

    function validateCardCVV(value) {
        let string = String(value)
        const validate = /^[0-9]{3,4}$/;
        return validate.test(string)
    }