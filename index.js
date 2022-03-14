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

rexailApp.controller('appController', function ($http, $scope, $filter, $location, $anchorScroll) {
    const ctrl = this;
    ctrl.state = {
        cartItems: [],
        total: '0.00',
        selectedCategory: null,
        selectedSortBy: null,
        formControl: {
            userComment: '',
            cardHolderID: null,
        },
        data: {
            storeData: [],
            categoriesData: []
        },
        errors: {
            cart: {
                userComment: false,
                productComment: false
            },
            checkout: {
                cardHolderName: null,
                cardHolderID: null,
                cardNumber: null,
                cardExpirationDate: null,
                cardCVV: null,
            }
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

    function calculateTotal() {
        const initialValue = 0;
        const sumWithInitial = ctrl.state.cartItems.reduce((totalSum, product) => totalSum + product['price'] * product.quantity, initialValue)
        return sumWithInitial.toFixed(2)
    }

    ctrl.getCurrentPath = function () {
        return $location.path();
    }

    ctrl.showMoreCategories = function () {
        return ctrl.state.data.categoriesData.length > 10
    }

    ctrl.handleCategoryClick = function (category) {
        /* ~~~ Debug comment to remove ~~~*/
        console.log(ctrl.state)
        ctrl.state.selectedCategory = category

        // scroll to top
        $anchorScroll();
    }

    ctrl.removeProduct = function (product) {
        product.quantity = null
        ctrl.state.cartItems = ctrl.state.cartItems.filter(item => item.id !== product.id)
        ctrl.state.total = calculateTotal();
    }

    ctrl.increaseProductQuantity = function (product) {
        if (!product.primaryQuantityUnit) { product.primaryQuantityUnit = {'amountJumps': 1} }
        product.quantity = product.quantity ? product.quantity + product.primaryQuantityUnit.amountJumps : product.primaryQuantityUnit.amountJumps;
        !ctrl.state.cartItems.includes(product) && ctrl.state.cartItems.unshift(product)
        ctrl.state.total = calculateTotal();
    }

    ctrl.decreaseProductQuantity = function (product) {
        if (product.quantity > product.primaryQuantityUnit.amountJumps) {
            product.quantity = product.quantity - product.primaryQuantityUnit.amountJumps
            !ctrl.state.cartItems.includes(product) && ctrl.state.cartItems.unshift(product)
        } else ctrl.removeProduct(product)
        ctrl.state.total = calculateTotal();
    }

    ctrl.clearCart = function () {
        ctrl.state.cartItems.forEach(item => item.quantity = null)
        ctrl.state.cartItems = []
        ctrl.state.total = calculateTotal();
    }

    // Products Sort by value
    ctrl.sortProductsBy = function (value) {
        ctrl.selectedSortBy = value
        if (value === 'שם מוצר') ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, '-name', true);
        if (value === 'מחיר מהנמוך לגבוה') ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, '-price', true);
        if (value === 'מחיר מהגבוהה לנמוך') ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, 'price', true);
        if (value === 'מוצרים במבצע') ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, 'promoted', true);
    }

    // Checkout validations
    ctrl.validateFormInput = function (value) {
        if (value === 'card-holder-name') ctrl.state.errors.checkout.cardHolderName = !validateCardHolderName(ctrl.state.formControl.cardHolderName)
        if (value === 'card-holder-id') ctrl.state.errors.checkout.cardHolderID = !validateCardHolderID(ctrl.state.formControl.cardHolderID)
        if (value === 'card-number') ctrl.state.errors.checkout.cardNumber = !validateCardNumber(ctrl.state.formControl.cardNumber)
        if (value === 'card-expiration-date') ctrl.state.errors.checkout.cardExpirationDate = !validateCardExpirationDate(ctrl.state.formControl.cardExpirationDate)
        if (value === 'card-cvv') ctrl.state.errors.checkout.cardCVV = !validateCardCVV(ctrl.state.formControl.cardCVV)
    }

    ctrl.addSlashExp = function () {
        let expire_date = document.getElementById('exp').value;
        if (expire_date.length == 2){
            document.getElementById('exp').value = expire_date +'/';
        }
    }

    // Enable or Disable submit checkout button
    ctrl.disableCheckoutForm = function () {
        let formValidations = Object.values(ctrl.state.errors.checkout)

        // checks whether an input form is invalid
        const isNotValid = (element) => (element === true || element === null);

        return formValidations.some(isNotValid)
    }

    // Cart validations
    ctrl.validateCart = function () {
        // Getting all products with preparation order prop
        let prepProducts = ctrl.state.cartItems.filter(product => product.commentType);
        // Getting all products with selected preparation order
        let validPrepProducts = prepProducts.filter(product => product.commentType && product.comment)

        // Check if user comment is empty
        ctrl.state.errors.cart.userComment = !ctrl.state.formControl.userComment.length

        // Check if all product's preparation methods are selected
        ctrl.state.errors.cart.productComment = (validPrepProducts.length !== prepProducts.length)

        // Redirect to /checkout if there are no errors
        if (!ctrl.state.errors.cart.userComment && !ctrl.state.errors.cart.productComment) $location.path('/checkout').replace();
    };

    // ctrl constants
    ctrl.imgBaseUrl = 'https://s3.eu-central-1.amazonaws.com/images-il.rexail.com/'


    /* ~~ $scope functions: ~~ */
    // Convert str to num expression in order to use in template
    $scope.parseFloat = parseFloat;

    // Setting initial value for pagination limit (infinite scroll)
    $scope.paginationLimit = 20

    // http get pagination goes here
    $scope.loadMore = function () {
        $scope.paginationLimit = $scope.paginationLimit + 10
    }
})

rexailApp.directive('storeItem', function () {
    return {
        templateUrl: 'directives/store-item.html', replace: true, scope: {
            product: '=',
            imgBaseUrl: '=',
            increaseProductQuantity: '&',
            decreaseProductQuantity: '&',
        },
        link: function (scope) {
            scope.handleQuantityUnitSelect = function (product, quantityUnit) {
                product.primaryQuantityUnit = quantityUnit.sellingUnit
                if (product.primaryQuantityUnit.amountJumps === 1) {
                    product.quantity = Math.round(product.quantity)
                }
            }
        }
    }
})

rexailApp.directive('itemPreview', function () {
    return {
        templateUrl: 'directives/item-preview.html',
        replace: true,
        scope: {
            product: '=',
            imgBaseUrl: '=',
            removeProduct: '&',
            increaseProductQuantity: '&',
            decreaseProductQuantity: '&'
        },
        link: function (scope) {
            scope.handleQuantityUnitSelect = function (product, quantityUnit) {
                product.primaryQuantityUnit = quantityUnit.sellingUnit
                if (product.primaryQuantityUnit.amountJumps === 1) {
                    product.quantity = Math.round(product.quantity)
                }
            }
        }
    }
})

rexailApp.directive('cartItem', function () {
    return {
        templateUrl: 'directives/cart-item.html',
        replace: true,
        scope: {
            product: '=',
            imgBaseUrl: '=',
            increaseProductQuantity: '&',
            decreaseProductQuantity: '&',
            removeProduct: '&',
            errors: '=',
        },
        link: function (scope) {
            scope.handleQuantityUnitSelect = function (product, quantityUnit) {
                product.primaryQuantityUnit = quantityUnit.sellingUnit
                if (product.primaryQuantityUnit.amountJumps === 1) {
                    product.quantity = Math.round(product.quantity)
                }
            }
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

function formatData(array) {
    return Object.values(array.reduce((obj, current) => {
        if (!obj[current.productCategory.id]) {
            obj[current.productCategory.id] = {
                id: current.productCategory.id,
                name: current.productCategory.name,
                children: []
            }
        }

        let productModel = {
            id: current.id,
            name: current.product.name,
            fullName: current.fullName,
            imageUrl: current.imageUrl,
            price: current.price,
            promoted: current.promoted,
            originalPrice: current.originalPrice,
            productQuality: current.productQuality,
            currentRelevancy: current.currentRelevancy,
            primaryQuantityUnit: current.product.primaryQuantityUnit,
            productSellingUnits: current.productSellingUnits,
            commentType: current.commentType
        }

        if (current.product.id) obj['0'].children.push(productModel)
        if (current.promoted) obj['1'].children.push(productModel)

        obj[current.productCategory.id].children.push(productModel)

        return obj
    }, {
        0: {id: 0, name: 'כל המוצרים', children: []}, 1: {id: 1, name: 'מבצעים', children: []}
    }))
}

// Util Functions
function validateCardHolderID(IDnum) {
    if (!IDnum) return false
    if (IDnum.length < 9) { while(IDnum.length < 9) { IDnum = '0' + IDnum; } }

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

