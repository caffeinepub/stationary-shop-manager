import Text "mo:core/Text";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Float "mo:core/Float";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  type Product = {
    id : Nat;
    name : Text;
    category : Text;
    costPrice : Float;
    sellingPrice : Float;
    stock : Nat;
    created : Time.Time;
    updated : Time.Time;
  };

  module Product {
    public func compareByName(a : Product, b : Product) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  type TransactionItem = {
    productId : Nat;
    productName : Text;
    quantity : Nat;
    costPrice : Float;
    sellingPrice : Float;
  };

  type Transaction = {
    id : Nat;
    items : [TransactionItem];
    totalRevenue : Float;
    totalCost : Float;
    totalProfit : Float;
    timestamp : Time.Time;
    user : Principal;
  };

  type Report = {
    totalRevenue : Float;
    totalCost : Float;
    totalProfit : Float;
    transactionCount : Nat;
    topProducts : [(Text, Nat)];
  };

  var nextProductId = 1;
  var nextTransactionId = 1;

  let products = Map.empty<Nat, Product>();
  let transactions = Map.empty<Nat, Transaction>();

  // Product CRUD Operations (Admin Only)
  public shared ({ caller }) func addProduct(product : Product) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    let newProduct : Product = {
      product with
      id = nextProductId;
      created = Time.now();
      updated = Time.now();
    };
    products.add(nextProductId, newProduct);
    let currentId = nextProductId;
    nextProductId += 1;
    currentId;
  };

  public shared ({ caller }) func updateProduct(id : Nat, product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    if (not products.containsKey(id)) {
      Runtime.trap("Product not found");
    };
    let updatedProduct : Product = {
      product with
      id;
      updated = Time.now();
    };
    products.add(id, updatedProduct);
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    if (not products.containsKey(id)) {
      Runtime.trap("Product not found");
    };
    products.remove(id);
  };

  public query ({ caller }) func getProduct(id : Nat) : async Product {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view products");
    };
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query ({ caller }) func getProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view products");
    };
    products.values().toArray().sort(Product.compareByName);
  };

  // Transaction Operations (Authenticated Users)
  public shared ({ caller }) func recordTransaction(inputItems : [TransactionItem]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can record transactions");
    };

    var totalRevenue = 0.0;
    var totalCost = 0.0;

    for (item in inputItems.values()) {
      totalRevenue += item.sellingPrice * item.quantity.toFloat();
      totalCost += item.costPrice * item.quantity.toFloat();

      // Reduce stock
      switch (products.get(item.productId)) {
        case (null) {
          Runtime.trap("Product not found for transaction");
        };
        case (?product) {
          if (product.stock < item.quantity) {
            Runtime.trap("Insufficient stock for " # product.name);
          };
          let updatedProduct : Product = {
            product with
            stock = product.stock - item.quantity;
          };
          products.add(item.productId, updatedProduct);
        };
      };
    };

    let totalProfit = totalRevenue - totalCost;

    let newTransaction : Transaction = {
      id = nextTransactionId;
      items = inputItems;
      totalRevenue;
      totalCost;
      totalProfit;
      timestamp = Time.now();
      user = caller;
    };

    transactions.add(nextTransactionId, newTransaction);
    let currentId = nextTransactionId;
    nextTransactionId += 1;
    currentId;
  };

  public query ({ caller }) func getTransaction(id : Nat) : async Transaction {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view transactions");
    };
    switch (transactions.get(id)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) { transaction };
    };
  };

  public query ({ caller }) func getTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view transactions");
    };
    transactions.values().toArray();
  };

  // Reporting (Authenticated Users)
  public query ({ caller }) func getReport() : async Report {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };

    var totalRevenue = 0.0;
    var totalCost = 0.0;
    let productSales = Map.empty<Text, Nat>();

    for (transaction in transactions.values().toArray().values()) {
      totalRevenue += transaction.totalRevenue;
      totalCost += transaction.totalCost;

      for (item in transaction.items.values()) {
        let currentQty = switch (productSales.get(item.productName)) {
          case (null) { 0 };
          case (?qty) { qty };
        };
        productSales.add(item.productName, currentQty + item.quantity);
      };
    };

    // Sort top products by quantity sold
    let sortedProducts = productSales.toArray();
    let topProducts = sortedProducts.sort(
      func(a, b) { Nat.compare(b.1, a.1) }
    );

    {
      totalRevenue;
      totalCost;
      totalProfit = totalRevenue - totalCost;
      transactionCount = transactions.size();
      topProducts;
    };
  };
};
