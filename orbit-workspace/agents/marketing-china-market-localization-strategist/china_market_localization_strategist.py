
import json
from typing import List, Dict, Any, Optional

class ChinaMarketLocalizationStrategist:
    """
    Full-stack China market localization expert who transforms real-time trend signals
    into executable go-to-market strategies across Douyin, Xiaohongshu, WeChat, Bilibili, and beyond.
    """

    def __init__(self):
        self.memory = {
            "platform_algorithm_shifts": {},
            "seasonal_consumption_cycles": ["618", "Double 11", "CNY", "520", "七夕"],
            "category_specific_trend_lifespans": {},
            "content_formats_conversion": {}
        }
        self.trend_data_store = [] # Stores raw trend signals

    def _apply_mental_models(self, data: List[Dict]) -> List[Dict]:
        """Applies the four mental models to raw trend data."""
        # This is a placeholder for actual sophisticated logic
        # In a real scenario, this would involve NLP, statistical analysis, etc.
        processed_data = []
        for item in data:
            # Signal Detection (见微知著) - simplified: just checking if it's new
            item["is_weak_signal"] = item.get("ranking", 100) > 20 and item.get("lifespan", 0) < 2
            
            # Triangulation (交叉验证) - simplified: checking for cross-platform presence
            item["cross_validated"] = item.get("cross_platform", "No") == "Yes"

            # Counter-Intuitive Thinking (反直觉思考) - placeholder
            item["counter_intuitive_opportunity"] = False 

            # MECE Structuring - assumed data is already somewhat structured
            processed_data.append(item)
        return processed_data

    def real_time_trend_intelligence(self, raw_trend_signals: List[Dict]) -> List[Dict]:
        """
        Monitors China's hotlist ecosystem and applies mental models for signal detection.
        
        Args:
            raw_trend_signals: A list of dictionaries, each representing a trend signal.
                               Example: [{"platform": "Douyin", "topic": "新中式穿搭", "ranking": 3, 
                                          "trajectory": "↑ ascending", "lifespan": 5, "cross_platform": "Yes (Weibo #12)"}]
        Returns:
            A list of processed trend signals with added insights from mental models.
        """
        self.trend_data_store.extend(raw_trend_signals)
        processed_signals = self._apply_mental_models(raw_trend_signals)
        print(f"Detected {len(processed_signals)} trend signals.")
        return processed_signals

    def market_opportunity_extraction(self, processed_signals: List[Dict]) -> Dict[str, Any]:
        """
        Converts raw trend data into structured market opportunities.
        
        Args:
            processed_signals: Output from real_time_trend_intelligence.
        
        Returns:
            A dictionary containing content track, comment track, and executable actions.
        """
        content_track = {
            "high_engagement_formats": [],
            "trending_keywords": [],
            "supply_demand_gap": "Identified based on signal analysis."
        }
        comment_track = {
            "need_words": [],
            "pain_points": [],
            "risk_words": []
        }
        executable_actions = []

        # Placeholder for actual extraction logic
        for signal in processed_signals:
            topic = signal.get("topic", "Unknown Topic")
            platform = signal.get("platform", "Unknown Platform")
            ranking = signal.get("ranking", 99)

            content_track["high_engagement_formats"].append(f"Short video on {platform} for '{topic}'")
            content_track["trending_keywords"].append(topic)
            comment_track["need_words"].append(f"'{topic}' related solutions")
            comment_track["pain_points"].append(f"Lack of options for '{topic}'")
            comment_track["risk_words"].append(f"Quality concerns for '{topic}'")

            executable_actions.append({
                "priority": f"P{min(3, int(ranking/10))}", # Simplified priority based on ranking
                "action": f"Develop content strategy for '{topic}'",
                "platform": platform,
                "effort": "3 days",
                "timeline": "Week 1",
                "success_metric": "Engagement rate > 3%"
            })
        
        print("Market opportunities extracted.")
        return {
            "content_track": content_track,
            "comment_track": comment_track,
            "executable_actions": executable_actions
        }

    def cross_platform_localization_strategy(self, opportunities: Dict[str, Any]) -> Dict[str, Any]:
        """
        Designs platform-specific content strategies.
        
        Args:
            opportunities: Output from market_opportunity_extraction.
            
        Returns:
            A dictionary with platform-specific content templates.
        """
        content_templates = {
            "Douyin": {
                "script": "Hook (0-3s): [specific hook line]
Problem (3-8s): [pain point visualization]
Solution (8-20s): [product demonstration]
CTA (20-30s): [specific call-to-action]",
                "notes": "Hook in 3 seconds, completion rate > engagement > shares, DOU+ boost timing"
            },
            "Xiaohongshu": {
                "template": "Title: [title with emoji formula]
Cover: [cover image specification]
Body: [structured content with keyword placement]
Tags: [10 optimized tags]",
                "notes": "70/20/10 content ratio (lifestyle/trend/product), aesthetic consistency, KOC seeding"
            },
            "WeChat": {
                "template": "Private domain nurturing, 60/30/10 content value rule, Mini Program integration",
                "notes": "Focus on value and community building."
            },
            "Bilibili": {
                "template": "Long-form depth, danmaku (弹幕) engagement design, UP主 collaboration",
                "notes": "Gen Z depth, authentic content."
            },
            "Weibo": {
                "template": "Trending topic mechanics, Super Topic operations, crisis preparedness",
                "notes": "Public opinion storms, rapid dissemination."
            },
            "Zhihu": {
                "template": "Authority-first Q&A positioning, credibility building, no hard selling",
                "notes": "Credibility anchoring, in-depth answers."
            }
        }
        print("Cross-platform localization strategies designed.")
        return content_templates

    def gtm_execution_planning(self, opportunities: Dict[str, Any]) -> Dict[str, Any]:
        """
        Structures launches in phased gates across 6-9 month timelines.
        
        Args:
            opportunities: Output from market_opportunity_extraction.
            
        Returns:
            A dictionary containing the GTM phase gate checklist.
        """
        product_name = "New Product X" # This would come from a more detailed input
        gtm_plan = {
            "P0 Signal Validation (Week 1-2)": [
                "Trend data collected from 3+ platforms",
                "Cross-platform signal triangulation completed",
                "TAM/SAM/SOM estimated with methodology documented",
                "Top 5 competitor content audit completed",
                "Platform selection justified with data",
                "Budget allocation: ¥[amount] across [platforms]"
            ],
            "P1 Seed Content (Week 3-4)": [
                "10 KOC candidates identified and contacted",
                "5 content variations A/B tested",
                "Baseline engagement metrics recorded",
                "Comment sentiment analysis completed",
                "Product-market fit hypothesis validated/invalidated",
                "Go/No-Go decision documented with evidence"
            ],
            "P2 Channel Activation (Week 5-8)": [
                "Platform ad accounts set up (Qianchuan/聚光/广点通)",
                "Paid amplification budget: ¥[amount]/day",
                "Organic + paid content calendar published",
                "Live commerce test session scheduled",
                "Private domain funnel (WeChat/WeCom) operational",
                "Daily data tracking dashboard configured"
            ]
        }
        print("GTM execution plan generated.")
        return gtm_plan

    def analyze_trend_data(self, raw_trend_signals: List[Dict], category: str = "General") -> str:
        """
        Orchestrates the entire analysis process and generates a comprehensive report.
        
        Args:
            raw_trend_signals: A list of dictionaries, each representing a trend signal.
            category: The product category for the report.
            
        Returns:
            A formatted markdown string of the China Market Opportunity Report.
        """
        processed_signals = self.real_time_trend_intelligence(raw_trend_signals)
        opportunities = self.market_opportunity_extraction(processed_signals)
        content_templates = self.cross_platform_localization_strategy(opportunities)
        gtm_plan = self.gtm_execution_planning(opportunities)

        report = f"# {category} China Market Opportunity Report\n\n"
        report += "## 📊 Signal Dashboard\n"
        report += "| Platform | Topic | Ranking | Trajectory | Lifespan | Cross-Platform? |\n"
        report += "|----------|-------|---------|------------|----------|-----------------|\n"
        for signal in processed_signals:
            report += (f"| {signal.get('platform', 'N/A')} | {signal.get('topic', 'N/A')} | #{signal.get('ranking', 'N/A')} | "
                       f"{signal.get('trajectory', 'N/A')} | {signal.get('lifespan', 'N/A')} days | {signal.get('cross_platform', 'N/A')} |\n")
        
        report += "\n## 🔍 Dual-Track Analysis\n"
        report += "### Content Track\n"
        report += f"- **High-engagement formats**: {', '.join(opportunities['content_track']['high_engagement_formats'])}\n"
        report += f"- **Trending keywords**: {', '.join(opportunities['content_track']['trending_keywords'])}\n"
        report += f"- **Supply-demand gap**: {opportunities['content_track']['supply_demand_gap']}\n"

        report += "\n### Comment Track\n"
        report += f"- **Need words**: {', '.join(opportunities['comment_track']['need_words'])}\n"
        report += f"- **Pain points**: {', '.join(opportunities['comment_track']['pain_points'])}\n"
        report += f"- **Risk words**: {', '.join(opportunities['comment_track']['risk_words'])}\n"

        report += "\n## 🎯 Executable Actions\n"
        report += "| Priority | Action | Platform | Effort | Timeline | Success Metric |\n"
        report += "|----------|--------|----------|--------|----------|----------------|\n"
        for action in opportunities['executable_actions']:
            report += (f"| {action['priority']} | {action['action']} | {action['platform']} | {action['effort']} | "
                       f"{action['timeline']} | {action['success_metric']} |\n")

        report += "\n## 📝 Content Templates\n"
        for platform, template_data in content_templates.items():
            report += f"### {platform} Template\n"
            if "script" in template_data:
                report += f"- Script: {template_data['script']}\n"
            if "template" in template_data:
                report += f"- Template: {template_data['template']}\n"
            report += f"- Notes: {template_data['notes']}\n"

        report += "\n## ⚠️ Risk & FAQ Preparation\n"
        report += "| Risk Word | Frequency | Response Template | Escalation? |\n"
        report += "|-----------|-----------|-------------------|-------------|\n"
        # Placeholder for actual risk words from comment track
        for risk_word in opportunities['comment_track']['risk_words']:
            report += f"| {risk_word} | High | [Prepared response for {risk_word}] | No |\n"

        report += "\n# GTM Execution Plan\n"
        for phase, checklist_items in gtm_plan.items():
            report += f"## Phase Gate: {phase}\n"
            for item in checklist_items:
                report += f"- [ ] {item}\n"
        
        print("China Market Opportunity Report generated.")
        return report

    def two_region_comparison_framework(self, china_signals: List[Dict], overseas_signals: List[Dict]) -> str:
        """
        Compares trends between China and overseas markets.
        
        Args:
            china_signals: List of trend signals from China.
            overseas_signals: List of trend signals from overseas.
            
        Returns:
            A formatted markdown string of the Two-Region Comparison Framework.
        """
        comparison_report = "# China vs. Overseas Trend Comparison\n\n"
        
        comparison_report += "## Cross-Region Opportunities (Both Signals Present)\n"
        comparison_report += "| Category | China Signal | Overseas Signal | Opportunity |\n"
        comparison_report += "|----------|-------------|-----------------|-------------|\n"
        # Simplified matching for demonstration
        for cs in china_signals:
            for os in overseas_signals:
                if cs.get("topic") == os.get("topic"):
                    comparison_report += (f"| {cs.get('category', 'N/A')} | {cs.get('platform', 'N/A')} #{cs.get('ranking', 'N/A')} | "
                                          f"{os.get('platform', 'N/A')} #{os.get('ranking', 'N/A')} | "
                                          f"Expand '{cs.get('topic')}' cross-border |\n")

        comparison_report += "\n## China-Only Signals (Localization Required)\n"
        comparison_report += "| Category | Platform | Signal | Local Context |\n"
        comparison_report += "|----------|----------|--------|---------------|\n"
        # Assuming signals not in overseas_signals are China-only
        china_only_topics = {s["topic"] for s in china_signals} - {s["topic"] for s in overseas_signals}
        for cs in china_signals:
            if cs["topic"] in china_only_topics:
                comparison_report += (f"| {cs.get('category', 'N/A')} | {cs.get('platform', 'N/A')} | {cs.get('topic', 'N/A')} | "
                                      f"Deep cultural relevance in China |\n")

        comparison_report += "\n## Overseas-Only Signals (Market Entry Potential)\n"
        comparison_report += "| Category | Platform | Signal | China Readiness |\n"
        comparison_report += "|----------|----------|--------|-----------------|\n"
        # Assuming signals not in china_signals are Overseas-only
        overseas_only_topics = {s["topic"] for s in overseas_signals} - {s["topic"] for s in china_signals}
        for os in overseas_signals:
            if os["topic"] in overseas_only_topics:
                comparison_report += (f"| {os.get('category', 'N/A')} | {os.get('platform', 'N/A')} | {os.get('topic', 'N/A')} | "
                                      f"Requires significant adaptation for China |\n")
        
        print("Two-Region Comparison Framework generated.")
        return comparison_report

if __name__ == "__main__":
    strategist = ChinaMarketLocalizationStrategist()

    # Example raw trend signals
    example_china_signals = [
        {"platform": "Douyin", "topic": "新中式穿搭", "ranking": 3, "trajectory": "↑ ascending", "lifespan": 5, "cross_platform": "Yes (Weibo #12)", "category": "Fashion"},
        {"platform": "Xiaohongshu", "topic": "早C晚A护肤", "ranking": 7, "trajectory": "→ stable", "lifespan": 8, "cross_platform": "Yes (Zhihu #7)", "category": "Beauty"},
        {"platform": "Bilibili", "topic": "AI绘画教程", "ranking": 15, "trajectory": "→ stable", "lifespan": 10, "cross_platform": "No", "category": "Tech"},
        {"platform": "Weibo", "topic": "国货美妆崛起", "ranking": 1, "trajectory": "↑ ascending", "lifespan": 3, "cross_platform": "Yes (Douyin #5)", "category": "Beauty"}
    ]

    example_overseas_signals = [
        {"platform": "TikTok", "topic": "Cottagecore Aesthetic", "ranking": 5, "trajectory": "↑ ascending", "lifespan": 7, "cross_platform": "Yes (Instagram)", "category": "Lifestyle"},
        {"platform": "YouTube", "topic": "AI Art Tutorials", "ranking": 10, "trajectory": "→ stable", "lifespan": 12, "cross_platform": "No", "category": "Tech"},
        {"platform": "Instagram", "topic": "Clean Beauty Trends", "ranking": 3, "trajectory": "↑ ascending", "lifespan": 6, "cross_platform": "Yes (TikTok)", "category": "Beauty"}
    ]

    # Generate China Market Opportunity Report
    print("Generating China Market Opportunity Report...")
    report = strategist.analyze_trend_data(example_china_signals, category="Fashion & Beauty")
    print(report)

    print("\n" + "="*80 + "\n")

    # Generate Two-Region Comparison Framework
    print("Generating Two-Region Comparison Framework...")
    comparison_report = strategist.two_region_comparison_framework(example_china_signals, example_overseas_signals)
    print(comparison_report)
