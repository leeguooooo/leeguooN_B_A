// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "LeeguooTV",
    platforms: [.tvOS(.v14)],
    products: [
        .executable(
            name: "LeeguooTV",
            targets: ["LeeguooTV"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/Alamofire/Alamofire.git", .upToNextMajor(from: "5.6.4")),
        .package(url: "https://github.com/SwiftyJSON/SwiftyJSON.git", from: "5.0.0")
    ],
    targets: [
        .executableTarget(
            name: "LeeguooTV",
            dependencies: [
                "Alamofire",
                "SwiftyJSON"
            ],
            path: "Sources"
        ),
        .testTarget(
            name: "LeeguooTVTests",
            dependencies: ["LeeguooTV"],
            path: "Tests"
        )
    ]
)