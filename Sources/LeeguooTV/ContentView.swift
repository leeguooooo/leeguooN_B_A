import SwiftUI
import Alamofire
import SwiftyJSON

struct Game: Identifiable {
    let id = UUID()
    let league: String
    let gameTime: String
    let team1: String
    let team2: String
    let team1Score: String?
    let team2Score: String?
    let team1Logo: String
    let team2Logo: String
    let liveLinks: [LiveLink]
}

struct LiveLink: Identifiable {
    let id = UUID()
    let name: String
    let url: String
}

struct ContentView: View {
    @State private var games: [Game] = []
    @State private var selectedLeague = "NBA"
    @State private var isLoading = true
    @State private var showLiveLinks = false
    @State private var selectedGame: Game? = nil
    
    private let leagues = ["NBA", "其他联赛"]
    
    var filteredGames: [Game] {
        games.filter { selectedLeague.isEmpty || $0.league == selectedLeague }
    }
    
    var body: some View {
        NavigationView {
            List(filteredGames) { game in
                GameRow(game: game)
                    .focusable(true)
                    .onPlayPauseCommand {
                        selectedGame = game
                        showLiveLinks = true
                    }
            }
            .navigationTitle("比赛直播")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Picker("选择联赛", selection: $selectedLeague) {
                        ForEach(leagues, id: \.self) { league in
                            Text(league).tag(league)
                        }
                    }
                }
            }
            .sheet(isPresented: $showLiveLinks) {
                if let game = selectedGame {
                    LiveLinksView(game: game, isPresented: $showLiveLinks)
                }
            }
            .onAppear {
                fetchGames()
            }
        }
    }
    
    private func fetchGames() {
        AF.request("http://localhost:3000/api/games")
            .responseJSON { response in
                switch response.result {
                case .success(let value):
                    if let json = value as? [[String: Any]] {
                        self.games = json.compactMap { gameData in
                            guard let league = gameData["league"] as? String,
                                  let gameTime = gameData["gameTime"] as? String,
                                  let team1 = gameData["team1"] as? String,
                                  let team2 = gameData["team2"] as? String,
                                  let team1Logo = gameData["team1Logo"] as? String,
                                  let team2Logo = gameData["team2Logo"] as? String,
                                  let liveLinksData = gameData["liveLinks"] as? [[String: Any]] else {
                                return nil
                            }
                            
                            let liveLinks = liveLinksData.compactMap { linkData -> LiveLink? in
                                guard let name = linkData["name"] as? String,
                                      let url = linkData["url"] as? String else {
                                    return nil
                                }
                                return LiveLink(name: name, url: url)
                            }
                            
                            return Game(
                                league: league,
                                gameTime: gameTime,
                                team1: team1,
                                team2: team2,
                                team1Score: gameData["team1Score"] as? String,
                                team2Score: gameData["team2Score"] as? String,
                                team1Logo: team1Logo,
                                team2Logo: team2Logo,
                                liveLinks: liveLinks
                            )
                        }
                    }
                    self.isLoading = false
                case .failure(let error):
                    print("Error fetching games: \(error)")
                    self.isLoading = false
                }
            }
    }
}

struct GameRow: View {
    let game: Game
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(game.league)
                    .font(.headline)
                Spacer()
                Text(game.gameTime)
                    .font(.subheadline)
            }
            
            HStack(spacing: 20) {
                AsyncImage(url: URL(string: game.team1Logo)) { image in
                    image.resizable()
                } placeholder: {
                    Color.gray
                }
                .frame(width: 60, height: 60)
                
                VStack {
                    Text(game.team1)
                    if let score = game.team1Score {
                        Text(score)
                            .font(.title)
                    }
                }
                
                Text("VS")
                    .font(.title2)
                
                VStack {
                    Text(game.team2)
                    if let score = game.team2Score {
                        Text(score)
                            .font(.title)
                    }
                }
                
                AsyncImage(url: URL(string: game.team2Logo)) { image in
                    image.resizable()
                } placeholder: {
                    Color.gray
                }
                .frame(width: 60, height: 60)
            }
        }
        .padding()
    }
}

struct LiveLinksView: View {
    let game: Game
    @Binding var isPresented: Bool
    
    var body: some View {
        NavigationView {
            List(game.liveLinks) { link in
                Button(action: {
                    if let url = URL(string: link.url) {
                        UIApplication.shared.open(url)
                    }
                }) {
                    Text(link.name)
                        .font(.title3)
                }
            }
            .navigationTitle("直播源")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("关闭") {
                        isPresented = false
                    }
                }
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}