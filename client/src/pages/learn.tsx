import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { 
  BookOpen, 
  ExternalLink, 
  PlayCircle, 
  FileText, 
  TrendingUp, 
  Users, 
  Shield, 
  Coins,
  Globe,
  Lightbulb,
  MessageSquare,
  Video,
  Trophy,
  Star,
  Target,
  CheckCircle2,
  Award,
  Zap,
  Crown,
  Medal
} from "lucide-react";

export default function Learn() {
  // Gamified learning state
  const [completedResources, setCompletedResources] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('completed-learning-resources');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [earnedAchievements, setEarnedAchievements] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('earned-achievements');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('completed-learning-resources', JSON.stringify(completedResources));
  }, [completedResources]);

  useEffect(() => {
    localStorage.setItem('earned-achievements', JSON.stringify(earnedAchievements));
  }, [earnedAchievements]);

  // Calculate user level and XP
  useEffect(() => {
    const totalXP = completedResources.length * 10 + earnedAchievements.length * 25;
    const level = Math.floor(totalXP / 100) + 1;
    setUserXP(totalXP);
    setUserLevel(level);
  }, [completedResources, earnedAchievements]);

  // Handle resource completion
  const handleResourceComplete = (resourceTitle: string) => {
    if (!completedResources.includes(resourceTitle)) {
      setCompletedResources(prev => [...prev, resourceTitle]);
      
      // Check for achievements
      const newCompletedCount = completedResources.length + 1;
      checkForAchievements(newCompletedCount);
      
      // Show completion feedback (you could add a toast notification here)
      console.log(`Completed: ${resourceTitle} (+10 XP)`);
    }
    
    // Open the resource
    window.open(getResourceUrl(resourceTitle), '_blank');
  };

  const checkForAchievements = (completedCount: number) => {
    const newAchievements: string[] = [];
    
    if (completedCount >= 1 && !earnedAchievements.includes('first-step')) {
      newAchievements.push('first-step');
    }
    if (completedCount >= 5 && !earnedAchievements.includes('knowledge-seeker')) {
      newAchievements.push('knowledge-seeker');
    }
    if (completedCount >= 10 && !earnedAchievements.includes('learning-master')) {
      newAchievements.push('learning-master');
    }
    if (completedCount >= 15 && !earnedAchievements.includes('oeconomia-expert')) {
      newAchievements.push('oeconomia-expert');
    }

    if (newAchievements.length > 0) {
      setEarnedAchievements(prev => [...prev, ...newAchievements]);
    }
  };

  const getResourceUrl = (title: string) => {
    // Map resource titles to URLs (simplified)
    const urlMap: { [key: string]: string } = {
      "Oeconomia Whitepaper": "https://oeconomia.io/whitepaper",
      "Tokenomics Guide": "https://oeconomia.io/tokenomics",
      "Governance Overview": "https://oeconomia.io/governance",
      "Getting Started Guide": "https://oeconomia.io/getting-started",
      "Staking Tutorial": "https://oeconomia.io/staking-guide",
      "Portfolio Management": "https://oeconomia.io/portfolio",
      "What is DeFi?": "https://ethereum.org/en/defi/",
      "Wallet Security": "https://ethereum.org/en/security/",
      "Understanding Gas Fees": "https://ethereum.org/en/developers/docs/gas/",
      "CoinDesk": "https://coindesk.com",
      "DeFi Pulse": "https://defipulse.com",
      "Oeconomia Blog": "https://medium.com/@oeconomia2025"
    };
    return urlMap[title] || "#";
  };

  // Achievement definitions
  const achievements = [
    {
      id: 'first-step',
      title: 'First Step',
      description: 'Complete your first learning resource',
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    },
    {
      id: 'knowledge-seeker',
      title: 'Knowledge Seeker',
      description: 'Complete 5 learning resources',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      id: 'learning-master',
      title: 'Learning Master',
      description: 'Complete 10 learning resources',
      icon: Crown,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10'
    },
    {
      id: 'oeconomia-expert',
      title: 'Oeconomia Expert',
      description: 'Complete 15 learning resources',
      icon: Trophy,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10'
    }
  ];

  const totalResources = 12; // Total number of learning resources
  const progressPercentage = (completedResources.length / totalResources) * 100;
  const xpToNextLevel = 100 - (userXP % 100);
  const levelProgress = (userXP % 100);

  // Reset progress for testing/demo purposes
  const resetProgress = () => {
    setCompletedResources([]);
    setEarnedAchievements([]);
    localStorage.removeItem('completed-learning-resources');
    localStorage.removeItem('earned-achievements');
  };
  const learningCategories = [
    {
      title: "Oeconomia Ecosystem",
      description: "Learn about the OEC token, governance, and ecosystem features",
      icon: Coins,
      gradient: "from-blue-500 to-cyan-400",
      resources: [
        {
          title: "Oeconomia Whitepaper",
          description: "Complete technical documentation and roadmap",
          type: "PDF",
          icon: FileText,
          url: "https://oeconomia.io/whitepaper"
        },
        {
          title: "Tokenomics Guide",
          description: "Understanding OEC token distribution and utility",
          type: "Article",
          icon: TrendingUp,
          url: "https://oeconomia.io/tokenomics"
        },
        {
          title: "Governance Overview",
          description: "How to participate in protocol decisions",
          type: "Guide",
          icon: Users,
          url: "https://oeconomia.io/governance"
        }
      ]
    },
    {
      title: "DApp Navigation",
      description: "Master the Oeconomia dashboard and all its features",
      icon: Globe,
      gradient: "from-purple-500 to-pink-400",
      resources: [
        {
          title: "Getting Started Guide",
          description: "Your first steps in the Oeconomia ecosystem",
          type: "Tutorial",
          icon: PlayCircle,
          url: "https://oeconomia.io/getting-started"
        },
        {
          title: "Staking Tutorial",
          description: "How to stake OEC tokens and earn rewards",
          type: "Video",
          icon: Video,
          url: "https://oeconomia.io/staking-guide"
        },
        {
          title: "Portfolio Management",
          description: "Track and optimize your DeFi positions",
          type: "Guide",
          icon: TrendingUp,
          url: "https://oeconomia.io/portfolio"
        }
      ]
    },
    {
      title: "Blockchain Basics",
      description: "Essential knowledge for navigating the crypto space",
      icon: Shield,
      gradient: "from-green-500 to-emerald-400",
      resources: [
        {
          title: "What is DeFi?",
          description: "Introduction to decentralized finance concepts",
          type: "Article",
          icon: Lightbulb,
          url: "https://ethereum.org/en/defi/"
        },
        {
          title: "Wallet Security",
          description: "Best practices for keeping your crypto safe",
          type: "Guide",
          icon: Shield,
          url: "https://ethereum.org/en/security/"
        },
        {
          title: "Understanding Gas Fees",
          description: "How transaction costs work on blockchain",
          type: "Article",
          icon: Coins,
          url: "https://ethereum.org/en/developers/docs/gas/"
        }
      ]
    },
    {
      title: "News & Updates",
      description: "Stay informed about crypto and DeFi developments",
      icon: MessageSquare,
      gradient: "from-orange-500 to-red-400",
      resources: [
        {
          title: "CoinDesk",
          description: "Latest cryptocurrency news and analysis",
          type: "News",
          icon: ExternalLink,
          url: "https://coindesk.com"
        },
        {
          title: "DeFi Pulse",
          description: "DeFi analytics and protocol updates",
          type: "Analytics",
          icon: TrendingUp,
          url: "https://defipulse.com"
        },
        {
          title: "Oeconomia Blog",
          description: "Official updates and ecosystem news",
          type: "Blog",
          icon: MessageSquare,
          url: "https://medium.com/@oeconomia2025"
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            {(completedResources.length > 0 || earnedAchievements.length > 0) && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetProgress}
                  className="text-xs opacity-50 hover:opacity-100"
                >
                  Reset Progress
                </Button>
              </div>
            )}
          </div>

          {/* Gamified Progress Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Level & XP Card */}
            <Card className="crypto-card border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Level {userLevel}</h3>
                      <p className="text-sm text-gray-400">Learning Explorer</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-400">{userXP} XP</p>
                    <p className="text-xs text-gray-400">{xpToNextLevel} XP to next level</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress to Level {userLevel + 1}</span>
                    <span className="text-white">{levelProgress}/100</span>
                  </div>
                  <Progress value={levelProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Overall Progress Card */}
            <Card className="crypto-card border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Learning Progress</h3>
                      <p className="text-sm text-gray-400">Resources Completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">{completedResources.length}/{totalResources}</p>
                    <p className="text-xs text-gray-400">{Math.round(progressPercentage)}% Complete</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Overall Completion</span>
                    <span className="text-white">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Achievements Card */}
            <Card className="crypto-card border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-400 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Achievements</h3>
                    <p className="text-sm text-gray-400">{earnedAchievements.length}/{achievements.length} Unlocked</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {achievements.map((achievement) => {
                    const isEarned = earnedAchievements.includes(achievement.id);
                    const AchievementIcon = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          isEarned 
                            ? `${achievement.bgColor} border-gray-600` 
                            : 'bg-gray-800/30 border-gray-700 opacity-50'
                        }`}
                        title={achievement.description}
                      >
                        <div className="flex items-center space-x-2">
                          <AchievementIcon className={`w-4 h-4 ${isEarned ? achievement.color : 'text-gray-500'}`} />
                          <span className={`text-xs font-medium ${isEarned ? 'text-white' : 'text-gray-500'}`}>
                            {achievement.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {learningCategories.map((category, index) => (
              <Card key={index} className="crypto-card border hover:border-gray-600 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{category.title}</CardTitle>
                      <p className="text-sm text-gray-400 mt-1">{category.description}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {category.resources.map((resource, resourceIndex) => {
                    const isCompleted = completedResources.includes(resource.title);
                    return (
                      <div
                        key={resourceIndex}
                        className={`p-4 rounded-lg transition-all duration-200 group cursor-pointer border ${
                          isCompleted 
                            ? 'bg-green-900/20 border-green-500/30 hover:bg-green-900/30' 
                            : 'bg-gray-800/50 border-transparent hover:bg-gray-800/70 hover:border-gray-600'
                        }`}
                        onClick={() => handleResourceComplete(resource.title)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isCompleted 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-700 group-hover:bg-gray-600'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <resource.icon className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium transition-colors ${
                                  isCompleted 
                                    ? 'text-green-400' 
                                    : 'text-white group-hover:text-cyan-400'
                                }`}>
                                  {resource.title}
                                </h4>
                                {isCompleted && (
                                  <Badge variant="secondary" className="bg-green-600/20 text-green-400 text-xs">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                {resource.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="inline-block px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">
                                  {resource.type}
                                </span>
                                {!isCompleted && (
                                  <div className="flex items-center space-x-1 text-xs text-cyan-400">
                                    <Zap className="w-3 h-3" />
                                    <span>+10 XP</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <ExternalLink className={`w-4 h-4 transition-colors flex-shrink-0 ml-2 ${
                            isCompleted 
                              ? 'text-green-400' 
                              : 'text-gray-500 group-hover:text-cyan-400'
                          }`} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Community Section */}
          <Card className="crypto-card border mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-xl text-white">
                <Users className="w-6 h-6 text-cyan-400" />
                <span>Join the Community</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-6">
                Connect with other Oeconomia users, ask questions, and stay updated with the latest developments.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="w-full justify-start space-x-2"
                  onClick={() => window.open('https://discord.com/invite/XSgZgeVD', '_blank')}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Discord Community</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start space-x-2"
                  onClick={() => window.open('https://x.com/Oeconomia2025', '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Twitter Updates</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start space-x-2"
                  onClick={() => window.open('https://medium.com/@oeconomia2025', '_blank')}
                >
                  <FileText className="w-4 h-4" />
                  <span>Medium Blog</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="crypto-card border mt-8">
            <CardContent className="p-6">
              <div className="text-center">
                <Lightbulb className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Need More Help?</h3>
                <p className="text-gray-400 mb-6">
                  Can't find what you're looking for? Our community and support team are here to help.
                </p>
                <Button 
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                  onClick={() => window.open('mailto:admin@oeconomia.io', '_blank')}
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}