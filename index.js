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

rexailApp.controller('appController', function ($http, $rootScope,$scope, $filter, $location, $anchorScroll) {
    $rootScope.$on("$locationChangeSuccess", function(){
        $anchorScroll();
    });

    const ctrl = this;
    ctrl.state = {
        cartItems: [],
        total: '0.00',
        userComment: '',
        selectedCategory: null,
        selectedSortBy: null,
        data: {
            storeData: [],
            categoriesData: []
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
        ctrl.state.selectedCategory = category

        // scroll to top
        $anchorScroll();
    }

    ctrl.removeProduct = function (product) {
        product.quantity = null
        ctrl.state.cartItems = ctrl.state.cartItems.filter(item => item !== product)
        ctrl.state.total = calculateTotal();
    }

    ctrl.increaseProductQuantity = function (product) {
        if (!product.defaultSellingUnit) product.defaultSellingUnit = {'amountJumps': 1}
        product.quantity = product.quantity ? product.quantity + product.defaultSellingUnit.amountJumps : product.defaultSellingUnit.amountJumps;
        !ctrl.state.cartItems.includes(product) && ctrl.state.cartItems.unshift(product)
        ctrl.state.total = calculateTotal();
    }

    ctrl.decreaseProductQuantity = function (product) {
        if (product.quantity > product.defaultSellingUnit.amountJumps) product.quantity = product.quantity - product.defaultSellingUnit.amountJumps
        !ctrl.state.cartItems.includes(product) && ctrl.state.cartItems.unshift(product)
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
        if (value === 'שם מוצר')
            ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, '-name', true);
        if (value === 'מחיר מהנמוך לגבוה')
            ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, '-price', true);
        if (value === 'מחיר מהגבוהה לנמוך')
            ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, 'price', true);
        if (value === 'מוצרים במבצע')
            ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, 'promoted', true);
    }

    //Form validations
    ctrl.validateCart = function () {
        // Getting all products with preparation order prop
        // let prepProducts = ctrl.state.products.filter(product => product['prepOptions']);
        // Getting all products with selected preparation order
        // let validPrepProducts = prepProducts.filter(product => product['prepOptions'] && product['selectedPrep'])

        // Check if user comment is empty
        ctrl.state.errors.userComment = !ctrl.state.userComment.length

        // Check if all product's preparation methods are selected
        // ctrl.errors.prepSelect = (validPrepProducts.length !== prepProducts.length)

        // Redirect to /checkout if there are no errors
        if (!ctrl.state.errors.userComment) $location.path('/checkout').replace();
    };

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
        scope : {
            product: '=',
            imgBaseUrl: '=',
            increaseProductQuantity: '&',
            decreaseProductQuantity: '&',
            removeProduct: '&'
        }
    }
})

rexailApp.directive('storeItem', function () {
    return {
        templateUrl: 'directives/store-item.html',
        replace: true,
        scope: {
            product: '=',
            imgBaseUrl: '=',
            increaseProductQuantity: '&',
            decreaseProductQuantity: '&'
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
        templateUrl: 'directives/nav-menu.html',
        replace: true,
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