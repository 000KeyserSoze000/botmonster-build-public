
export const fr = {
    // General
    loading: 'Chargement...',
    saveAndClose: 'Sauvegarder & Fermer',
    cancel: 'Annuler',
    close: 'Fermer',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    create: 'Créer',
    update: 'Mettre à jour',
    loadingTradingJournal: 'Chargement du Journal de Trading...',
    enabled: 'Activé',
    disabled: 'Désactivé',
    next: 'Suivant',
    open: 'Ouvrir',
    finish: 'Terminer',
    skip_tour: 'Passer le tour',
    info_button: 'Informations',
    restore_settings: 'Restaurer les réglages',
    start: 'Début',
    end: 'Fin',
    step: 'Étape',
    import_strategy_tooltip: 'Importer une Stratégie',
    unknown_strategy: 'Stratégie Inconnue',
    coming_soon: 'Bientôt disponible',
    
    // Header & Time
    manageWatchlist: 'Gérer la watchlist',
    showPairBar: 'Afficher la barre des paires',
    hidePairBar: 'Masquer la barre des paires',
    openSettings: 'Ouvrir les paramètres',
    robotOn: 'Robot ON',
    robotOff: 'Robot OFF',
    time_ago_now: "à l'instant",
    time_ago_seconds: 'il y a {{seconds}}s',
    api_status_label: 'Charge API',
    api_status_tooltip: 'Poids des requêtes API utilisées (par minute) : {{used}} / {{limit}}',
    toggleBottomPanel: 'Afficher/Masquer le Journal',
    timeframe_label: 'Unité de Temps',
    
    // Trading Modes
    backtestMode: 'Backtest',
    paperMode: 'Papier',
    liveMode: 'Live',
    reviewMode: 'Revue',

    // Main App
    loadingData: 'Chargement des Données...',
    optimizingInProgress: 'Optimisation en cours...',
    aiError: "Erreur de l'Analyse IA : {{message}}",
    unknownError: 'Une erreur inconnue est survenue.',
    openScannerPanel: 'Ouvrir le panneau du scanner',
    closeScannerPanel: 'Fermer le panneau du scanner',
    openSidebar: 'Ouvrir le panneau latéral',
    closeSidebar: 'Fermer le panneau latéral',

    // Panneau de Gauche (Centre de Commande)
    command_center_title: 'Centre de Commande',
    command_center_section_analysis: 'Analyse de Marché',
    command_center_section_alerts: 'Centre d\'Alertes',
    command_center_section_help: 'Centre d\'Aide',
    command_center_toggle_scanner: 'Scanner',
    command_center_toggle_heatmap: 'Heatmap',
    scanner_tab_scanner: 'Scanner',
    alerts_tab_alerts: 'Alertes',
    scanner_preset_label: 'Charger une présélection...',
    scanner_run_scan: 'Lancer le Scan',
    scanner_scanning_button: 'Scan en cours...',
    scanner_results_title: 'Résultats',
    scanner_no_results_title: 'Aucun résultat.',
    scanner_no_results_subtitle: 'Ajustez vos filtres et lancez un nouveau scan.',
    scanner_add_to_watchlist_tooltip: 'Ajouter à la watchlist',
    scanner_already_in_watchlist_tooltip: 'Déjà dans la watchlist',
    alerts_panel_title: 'Centre d\'Alertes',
    alerts_panel_empty_title: 'Centre d\'Alertes',
    alerts_panel_empty_subtitle: 'Les signaux et événements de votre watchlist apparaîtront ici.',
    help_section_title: 'Aide',
    scanner_in_progress: 'Recherche en cours...',
    strategy_step_counter: 'Étape {{metSteps}}',
    scroll_left: 'Défiler à gauche',
    scroll_right: 'Défiler à droite',
    scanner_scanning_status: 'Scan en cours...',
    manage_presets_tooltip: 'Gérer les présélections',

    // Panneau de Droite (Stratégies)
    strategies_title: 'Poste de Pilotage',
    strategies_section_active: 'Stratégie Active',
    strategies_section_info_button: 'Informations',
    strategies_section_live_status: 'État en Direct',
    strategies_section_settings: 'Réglages de la Stratégie',
    strategies_section_visual_indicators: 'Indicateurs Visuels',
    strategies_workshop_title: 'Atelier de Recherche',
    strategies_config_title: 'Configuration de la Stratégie',
    strategies_restore_settings: 'Restaurer les réglages',
    strategies_optimization_center_title: 'Centre d\'Optimisation',
    strategies_optimization_config_line: '{{id}}: de {{start}} à {{end}} (pas {{step}})',
    strategies_launch_title: 'Lancement',
    strategies_data_period_label: 'Période des Données',
    strategies_visual_backtest_label: 'Backtest Visuel',
    strategies_run_visual_backtest: 'Lancer Backtest Visuel',
    strategies_run_quick_backtest: 'Lancer Backtest Rapide',
    strategies_run_optimization: "Lancer l'Optimisation ({{count}})",
    strategies_run_portfolio_backtest: 'Backtest de Portefeuille',
    strategies_backtest_in_progress: 'Backtest en Cours...',
    strategies_optimization_in_progress: 'Optimisation...',
    strategies_loading_in_progress: 'Chargement...',
    strategies_analyze_button: "Analyser avec l'IA",
    strategies_analyzing_button: "Analyse IA...",
    
    // Panneau du Bas (Journal de Bord)
    bottom_panel_open_trades_tab: 'Trades en cours',
    bottom_panel_history_tab: 'Historique',
    bottom_panel_session_tab: 'Session',
    bottom_panel_journal_tab: 'Journal',
    bottom_panel_backtests_tab: 'Backtests',
    bottom_panel_logs_tab: 'Logs',
    bottom_panel_clear_history_button: 'Vider',
    bottom_panel_compare_button: 'Comparer les 2 Sessions Sélectionnées',
    open_trades_no_trades: 'Aucun trade en cours pour le mode {{mode}}.',
    history_no_trades: 'Aucune transaction dans l\'historique de cette session.',
    session_no_session: 'Aucune session active.',
    session_no_session_subtitle: 'Démarrez le robot pour commencer une nouvelle session.',
    session_waiting_for_trades: 'En attente de trades.',
    session_waiting_for_trades_subtitle: 'Les statistiques de la session apparaîtront ici une fois votre premier trade clôturé.',
    journal_no_sessions: 'Aucune session dans le journal.',
    backtests_no_backtests: 'Aucun backtest dans l\'historique.',
    logs_no_logs: 'Le journal des événements est vide. Le robot doit être actif.',
    clear_button: 'Vider',
    clear_history_tooltip: "Arrêtez le robot pour effacer l'historique",
    clear_history_tooltip_alt: "Effacer l'historique",
    expand_panel: 'Agrandir le panneau',
    collapse_panel: 'Réduire le panneau',
    close_position_button: 'Fermer',
    close_position_tooltip: 'Fermer la position manuellement au prix actuel du marché',

    // Headers du journal de bord
    header_pair: 'Paire',
    header_strategy: 'Stratégie',
    header_direction: 'Direction',
    header_entry: 'Entrée',
    header_size: 'Taille ($)',
    header_sl_tp: 'SL / TP',
    header_pnl: 'P&L',
    header_action: 'Action',
    header_entry_exit: 'Entrée / Sortie',
    header_rr: 'R:R',
    header_duration: 'Durée',
    header_reason: 'Raison',
    header_date: 'Date',
    header_mode: 'Mode',
    header_trades: 'Trades',
    header_win_rate: 'Taux Réussite',
    header_net_profit: 'Profit Net',
    header_pair_strategy: 'Paire / Stratégie',

    // Statistiques de Session
    stat_net_profit: 'Profit Net',
    stat_profit_factor: 'Facteur de Profit',
    stat_total_trades: 'Total Trades',
    stat_win_rate: 'Taux de Réussite',
    stat_winners: 'Gagnants',
    stat_losers: 'Perdants',
    stat_avg_gain: 'Gain Moyen',
    stat_avg_loss: 'Perte Moyenne',
    stat_max_drawdown: 'Drawdown Max',

    // Définitions des Stratégies
    'strategy_order-flow-smc_name': 'Order Flow (SMC)',
    'strategy_order-flow-smc_desc': `### Stratégie Order Flow (Smart Money Concepts) - Long Uniquement

Cette stratégie tente d'identifier les manipulations de marché par la "Smart Money" pour entrer dans la direction opposée. Elle est basée sur le principe que les institutions créent de la liquidité en déclenchant les stops des traders particuliers avant de pousser le marché dans la direction initialement prévue. **Cette version est configurée pour ne prendre que des positions LONGUES.**

#### Étape 1 : Tendance de Fond (HTF)
- **Objectif :** Déterminer la tendance générale.
- **Méthode :** Une Moyenne Mobile Exponentielle (EMA) est utilisée. La tendance fournit un contexte, pas un filtre strict.

#### Étape 2 : Prise de Liquidité
- **Objectif :** Confirmer une manipulation de marché ou un pullback sain.
- **Méthode :** Nous attendons que le prix **casse un plus bas significatif précédent ("swing low")** puis récupère rapidement. C'est la "prise" (grab).

#### Étape 3 : Retour au Point d'Intérêt (POI)
- **Objectif :** Identifier une zone où la Smart Money a probablement placé ses ordres d'achat.
- **Méthode :** Après la prise, nous cherchons une zone de **Fair Value Gap (FVG) Haussier** laissée lors d'un précédent mouvement haussier. Le prix doit revenir dans cette zone.

#### Étape 4 : Signal d'Entrée
- **Objectif :** Entrer en position lorsque le prix réagit à la zone.
- **Méthode :** Un signal est déclenché si le prix entre dans le FVG et montre une forte réaction haussière (ex: une forte bougie verte).
- **Gestion du Risque :** Le Stop Loss (SL) est placé juste en dessous du prix extrême de la prise de liquidité.`,
    'strategy_scalping-ema-cross_name': 'Scalping Croisement EMA',
    'strategy_scalping-ema-cross_desc': `### Stratégie de Scalping par Croisement d'EMA (Améliorée avec Filtres)

Cette stratégie est une approche classique de suivi de tendance, conçue pour capturer des mouvements rapides et de faible amplitude. Elle a été améliorée avec deux filtres professionnels pour augmenter la qualité des signaux.

#### Étape 1 : Alignement de Tendance Multi-Temporelle (Filtre de Contexte)
- **Objectif :** S'assurer de trader dans le sens de la tendance de fond pour augmenter la probabilité de succès.
- **Méthode :** Nous analysons la tendance sur une unité de temps supérieure (par défaut, 1 Heure). Si le prix est au-dessus de sa moyenne mobile (EMA 50) sur le 1H, la tendance de fond est haussière et le bot est autorisé à chercher des signaux d'achat. Sinon, il reste inactif.

#### Étape 2 : Force de la Tendance (Filtre ADX)
- **Objectif :** S'assurer que le marché est en forte tendance avant de chercher un signal. C'est le "garde-fou anti-range".
- **Méthode :** Nous utilisons l'indicateur **ADX (Average Directional Index)**. Si la valeur de l'ADX est **inférieure à un certain seuil (par défaut 25)**, la stratégie considère que le marché est en range et **bloque toute prise de position**.

#### Étape 3 : Tendance par Croisement d'EMA (UT de travail)
- **Objectif :** Déterminer le sens de la tendance à court terme.
- **Méthode :** Sur l'unité de temps de travail, la tendance est haussière lorsque l'**EMA rapide est au-dessus de l'EMA lente**.

#### Étape 4 : Pullback & Signal d'Entrée
- **Objectif :** Entrer dans la tendance à un prix favorable après confirmation.
- **Méthode :** Nous attendons un **"pullback"** (retour) du prix sur l'EMA rapide. Le signal d'entrée est donné si une bougie haussière confirme que les acheteurs reprennent la main.`,
    'strategy_volume-anomaly-scalper_name': 'Scalper d\'Anomalie de Volume',
    'strategy_volume-anomaly-scalper_desc': `### Stratégie Scalper d'Anomalie de Volume (Long-Only)

Cette stratégie est une approche de scalping pure conçue pour le marché SPOT. Elle est basée sur un événement de marché très spécifique : un pic de volume haussier soudain et massif, qui est souvent la signature d'une intervention institutionnelle. Le but est de surfer sur la vague de momentum immédiate créée par cette action.

#### Étape 1 : Détection de l'Anomalie de Volume
- **Objectif :** Identifier un volume d'échange anormalement élevé.
- **Méthode :** Nous calculons une **Moyenne Mobile Simple (SMA)** du volume sur une période donnée (ex: 20 bougies). Nous attendons ensuite une bougie dont le volume est **extrêmement supérieur** à cette moyenne (ex: 5 fois supérieur). C'est le signal que quelque chose d'inhabituel se produit.

#### Étape 2 : Analyse de la Bougie et Signal d'Entrée
- **Objectif :** Entrer dans le sens du mouvement initié par le pic de volume.
- **Méthode :** Une fois la bougie anormale identifiée, nous vérifions si elle est **HAUSSIÈRE**. Si c'est le cas, un signal d'achat (LONG) est déclenché. Les anomalies sur des bougies baissières sont **ignorées**.
- **Gestion du Risque :** C'est une stratégie à très court terme.
    - Le **Stop Loss (SL)** est placé de manière très agressive juste en dessous du plus bas de la bougie anormale.
    - Le **Take Profit (TP)** est calculé sur la base d'un ratio Risque/Récompense fixe (ex: 1.5R).

#### Conseil Crucial
**Un dernier conseil crucial :** cette stratégie est infiniment plus efficace sur les paires à **très forte liquidité** (comme BTC/USDC, ETH/USDC, etc.). Sur une paire peu liquide, le volume est naturellement erratique et un "pic" ne veut rien dire. Sur une paire liquide, un pic de volume est une information qui vaut de l'or.`,
    'strategy_rsi-divergence-hunter_name': 'Chasseur de Divergence RSI',
    'strategy_rsi-divergence-hunter_desc': `### Stratégie Chasseur de Divergence RSI (Long-Only)

Cette stratégie de retournement de tendance se concentre sur un concept puissant : la divergence RSI (Relative Strength Index) haussière. Elle vise à acheter à la fin d'une tendance baissière, juste avant un potentiel retournement à la hausse.

#### Étape 1 : Contexte de Survente
- **Objectif :** S'assurer que le marché est "survendu" et prêt pour un rebond.
- **Méthode :** Nous utilisons le RSI. Le marché est considéré comme survendu lorsque le RSI passe sous un certain seuil (par défaut 30).

#### Étape 2 : Détection de la Divergence Haussière
- **Objectif :** Identifier le signal clé de retournement.
- **Méthode :** Une divergence haussière se produit lorsque :
  1. Le **prix** fait un **plus bas plus bas** (un creux plus bas que le précédent).
  2. Le **RSI** fait un **plus bas plus haut** (un creux plus haut que le précédent).
- **Signification :** Cela montre que bien que le prix continue de baisser, la **force** (momentum) derrière la baisse s'estompe. C'est un indicateur avancé d'un retournement.

#### Étape 3 : Bougie de Confirmation
- **Objectif :** Attendre la confirmation que les acheteurs reprennent le contrôle.
- **Méthode :** Après avoir repéré la divergence, nous attendons une **bougie haussière forte** qui clôture au-dessus du dernier plus bas du prix. C'est le déclencheur final.

#### Gestion du Risque
- **Stop Loss (SL) :** Placé juste en dessous du dernier plus bas du prix (le deuxième creux de la divergence).
- **Take Profit (TP) :** Calculé sur la base d'un ratio Risque/Récompense (R:R) fixe.`,

    // Configuration des Réglages
    'setting_label_enabled': 'Activer la Stratégie',
    'setting_help_enabled': '',
    'setting_label_riskRewardRatio': 'Ratio Risque/Récompense',
    'setting_help_riskRewardRatio': 'Le ratio R:R pour déterminer le Take Profit.',
    'setting_label_trailingStop': 'Stop Suiveur',
    'setting_help_trailingStop': 'Distance en % pour le stop suiveur. 0 pour désactiver.',
    'setting_label_htfEmaPeriod': 'Période EMA Tendance',
    'setting_help_htfEmaPeriod': 'La période de l\'EMA pour la tendance de fond.',
    'setting_label_swingLookback': 'Fenêtre de Swing',
    'setting_help_swingLookback': 'Nombre de bougies de chaque côté pour définir un point de swing.',
    'setting_label_zoneSearchWindow': 'Fenêtre de Recherche de Zone',
    'setting_help_zoneSearchWindow': 'Nombre de bougies à scanner en arrière pour trouver un FVG/OB.',
    'setting_label_useMtfFilter': 'Filtre de Tendance Multi-Temporel',
    'setting_help_useMtfFilter': 'Active/désactive le filtre de tendance basé sur l\'EMA 1H.',
    'setting_label_mtfEmaPeriod': 'Période EMA 1H',
    'setting_help_mtfEmaPeriod': 'La période de l\'EMA sur l\'unité de temps supérieure pour le contexte de tendance.',
    'setting_label_fastEmaPeriod': 'Période EMA Rapide',
    'setting_help_fastEmaPeriod': 'La période de l\'EMA rapide pour les signaux d\'entrée.',
    'setting_label_slowEmaPeriod': 'Période EMA Lente',
    'setting_help_slowEmaPeriod': 'La période de l\'EMA lente pour le contexte de tendance.',
    'setting_label_adxPeriod': 'Période ADX',
    'setting_help_adxPeriod': 'La période de l\'indicateur ADX pour mesurer la force de la tendance.',
    'setting_label_adxThreshold': 'Seuil ADX',
    'setting_help_adxThreshold': 'L\'ADX doit être au-dessus de ce seuil pour autoriser un trade.',
    'setting_label_volumeSmaPeriod': 'Période SMA Volume',
    'setting_help_volumeSmaPeriod': 'La période de la moyenne mobile simple du volume.',
    'setting_label_volumeFactor': 'Facteur de Volume',
    'setting_help_volumeFactor': 'Multiplicateur du volume moyen pour déclencher un signal.',
    'setting_label_rsiPeriod': 'Période RSI',
    'setting_help_rsiPeriod': 'La période pour l\'indicateur RSI.',
    'setting_label_rsiOversoldThreshold': 'Seuil de Survente RSI',
    'setting_help_rsiOversoldThreshold': 'Le RSI doit être en dessous de ce seuil pour un contexte d\'achat.',
    'setting_label_confirmationCandleLookback': 'Fenêtre de Confirmation',
    'setting_help_confirmationCandleLookback': 'Nombre de bougies à observer pour une confirmation après une divergence.',

    // Configuration des Indicateurs
    'indicator_label_showFVG': 'Fair Value Gaps (FVG)',
    'indicator_label_showOB': 'Order Blocks (OB)',
    'indicator_label_showSwings': 'Swings (H/L)',
    'indicator_label_showLiquidityGrabs': 'Prises de Liquidité',
    'indicator_label_showFastEma': 'EMA Tendance',
    'indicator_label_showVolumeProfile': 'Profil de Volume',
    'indicator_label_showSlowEma': 'EMA Lente',
    'indicator_label_showPivots': 'Points Pivots',
    'indicator_label_showVolumeAnomaly': 'Anomalies de Volume',
    'indicator_label_showRsi': 'Indicateur RSI',
    'indicator_label_showMacd': 'MACD',
    'indicator_label_showAtr': 'ATR',
    'indicator_label_showBollingerBands': 'Bandes de Bollinger',
    'indicator_label_showStochastic': 'Stochastique',
    'indicator_label_showIchimoku': 'Nuage Ichimoku',
    'indicator_label_showSupertrend': 'Supertrend',
    'indicator_label_showVwap': 'VWAP',
    'indicator_label_showObv': 'OBV',
    'indicator_label_showDivergence': 'Lignes de Divergence',

    // Étapes de la Stratégie
    'strategy_step_entry_confirmation': 'Confirmation d\'Entrée',
    'strategy_step_details_risk_limit': 'Signal ignoré : Exposition au risque maximale atteinte.',
    'strategy_step_details_insufficient_capital': 'Signal ignoré : Taille de position non calculable (vérifiez les réglages de risque, le placement du SL et le capital disponible).',
    
    // Stratégie Order Flow
    'orderFlow_step1_name': 'Analyse de la Tendance',
    'orderFlow_step2_name': 'Identification du Swing Low',
    'orderFlow_step3_name': 'Attente de la Prise de Liquidité',
    'orderFlow_step4_name': 'Recherche de FVG Haussier',
    'orderFlow_step5_name': 'Retour au POI',
    'orderFlow_step6_name': 'Signal de Confirmation',
    'orderFlow_step_pending_details': 'En attente de données...',
    'orderFlow_step_trade_open': 'Un trade est déjà ouvert.',
    'orderFlow_step_disabled': 'Stratégie désactivée.',
    'orderFlow_step_insufficient_data': 'Données EMA insuffisantes pour l\'analyse.',
    'orderFlow_step1_details': 'Tendance de fond {{direction}} (Prix {{priceDirection}} EMA {{period}})',
    'orderFlow_step2_details': 'Cible de swing low identifiée à {{value}}',
    'orderFlow_step2_waiting': 'Recherche d\'un point de swing low...',
    'orderFlow_step3_details': 'Liquidité prise en dessous de {{value}}.',
    'orderFlow_step3_waiting': 'En attente d\'une cassure sous {{value}}...',
    'orderFlow_step4_details': 'FVG haussier trouvé [{{bottom}}, {{top}}]',
    'orderFlow_step4_waiting': 'Aucun FVG haussier frais trouvé après la prise.',
    'orderFlow_step5_details': 'Le prix est retourné dans la zone FVG.',
    'orderFlow_step5_waiting': 'En attente d\'un retour dans le FVG [{{bottom}}, {{top}}]',
    'orderFlow_step6_fired': 'Signal déjà envoyé. En attente d\'exécution ou d\'invalidation.',
    'orderFlow_step6_invalid_risk': 'Signal invalidé : Risque nul ou négatif.',
    'orderFlow_step6_confirmed': 'Signal LONG confirmé par bougie haussière.',
    'orderFlow_step6_waiting': 'En attente d\'une bougie de confirmation haussière dans la zone.',
    'orderFlow_alert_entry': 'Entrée LONG sur {{pair}}',

    // Stratégie Scalping
    'scalping_step1_name': 'Alignement Tendance HTF',
    'scalping_step2_name': 'Force de la Tendance (ADX)',
    'scalping_step3_name': 'Tendance Croisement EMA',
    'scalping_step4_name': 'Pullback sur EMA Rapide',
    'scalping_step5_name': 'Signal d\'Entrée',
    'scalping_step_insufficient_data': 'Données de bougies insuffisantes pour l\'analyse.',
    'scalping_step1_missing_data': 'Données de tendance {{timeframe}} manquantes.',
    'scalping_step1_bullish': 'Tendance {{timeframe}} Haussière (Prix > EMA {{period}})',
    'scalping_step1_not_bullish': 'Tendance {{timeframe}} non Haussière (Prix <= EMA {{period}})',
    'scalping_step1_disabled': 'Filtre désactivé.',
    'scalping_step2_strong': 'Tendance forte détectée (ADX {{adx}} > {{threshold}})',
    'scalping_step2_weak': 'Marché en range (ADX {{adx}} <= {{threshold}})',
    'scalping_step3_bullish': 'Tendance Haussière (EMA {{fast}} > EMA {{slow}})',
    'scalping_step3_not_bullish': 'Pas en tendance haussière (EMA {{fast}} <= EMA {{slow}})',
    'scalping_step4_bullish_reaction': 'Pullback sur EMA {{period}} et réaction haussière.',
    'scalping_step4_waiting': 'En attente d\'un pullback sur EMA {{period}}',
    'scalping_step5_fired': 'Signal déjà envoyé. En attente d\'exécution ou d\'invalidation.',
    'scalping_step5_invalid_risk': 'Risque invalide.',
    'scalping_step5_ready': 'Signal prêt',
    'scalping_alert_entry': 'Entrée LONG sur pullback EMA',
    
    // Stratégie Anomalie de Volume
    'volume_step1_name': 'Détection d\'Anomalie',
    'volume_step2_name': 'Analyse de la Bougie',
    'volume_step3_name': 'Signal d\'Entrée',
    'volume_step1_waiting': 'Recherche d\'un pic de volume...',
    'volume_step1_met': 'Pic de volume détecté ({{multiplier}}x la moyenne)',
    'volume_step2_unmet': 'Bougie anormale est baissière. Signal ignoré (long-only).',
    'volume_step2_met': 'Bougie anormale est haussière.',
    'volume_step3_invalid_risk': 'Risque invalide (bougie sans corps/mèche).',
    'volume_alert_entry': 'Signal d\'entrée LONG sur {{pair}}',

    // Stratégie Divergence RSI
    'rsi_step1_name': 'Contexte de Survente',
    'rsi_step2_name': 'Divergence Haussière',
    'rsi_step3_name': 'Bougie de Confirmation',
    'rsi_step4_name': 'Signal d\'Entrée',
    'rsi_step1_met': 'RSI ({{rsi}}) est en zone de survente (< {{threshold}})',
    'rsi_step1_waiting': 'En attente que le RSI entre en zone de survente (< {{threshold}})',
    'rsi_step1_active_div': 'RSI ({{rsi}}) a quitté la zone de survente, divergence toujours active.',
    'rsi_step2_met': 'Divergence haussière confirmée entre les plus bas.',
    'rsi_step2_waiting': 'Recherche d\'une divergence haussière...',
    'rsi_step3_met': 'Bougie de confirmation haussière détectée.',
    'rsi_step3_waiting': 'En attente d\'une bougie de confirmation haussière.',
    'rsi_alert_entry': 'Signal d\'entrée LONG sur divergence RSI pour {{pair}}',
    
    // Logs d'Alertes & Popups
    alert_tp_hit: 'Take Profit atteint à {{price}}',
    alert_sl_hit: 'Stop Loss ({{reason}}) atteint à {{price}}',
    alert_liquidity_grab: 'Prise de liquidité détectée sur {{pair}}',
    alertPopup_entryTitle: 'Signal d\'Entrée Détecté',
    alertPopup_grabTitle: 'Signal de Prise Détecté',

    // Scanner
    scanner_start: '[Scanner] Démarrage du scan de marché.',
    scanner_volume_filter_results: '[Scanner] {{count}} paires trouvées après le filtre de volume.',
    scanner_cancelled: '[Scanner] Scan annulé par l\'utilisateur.',
    scanner_strategy_filter_start: '[Scanner] Démarrage du filtre de stratégie : {{strategyName}}.',
    scanner_failed: 'Scan échoué : {{error}}',
    scanner_finished: '[Scanner] Scan de marché terminé.',
    scanner_scanning: 'Scan en cours...',

    // Backtest
    initializing: 'Initialisation...',
    fetching_data_for_optimization: 'Récupération des données pour l\'optimisation...',
    backtest_running: 'Backtest en cours d\'exécution...',
    error_insufficient_data: 'Données historiques insuffisantes pour lancer le backtest.',
    error_load_failed: 'Échec du chargement des données de backtest : {{message}}',
    error_insufficient_data_optimization: 'Données historiques insuffisantes pour l\'optimisation.',
    error_optimization_failed: 'Échec de l\'optimisation : {{message}}',
    error_empty_watchlist: 'La watchlist est vide. Impossible de lancer le backtest de portefeuille.',
    error_portfolio_backtest_failed: 'Échec du backtest de portefeuille : {{message}}',

    // Mode Revue
    reviewModeBanner_title: 'Mode Revue - Analyse de l\'événement sur :',
    reviewModeBanner_button: 'Retourner au mode {{mode}}',
    
    // Contexte des Alertes
    loadingAlertContext: "Chargement du contexte de l'alerte...",
    error_historical_data_alert: "Impossible de récupérer les données historiques pour cet événement.",
    error_alert_context_load: "Échec du chargement du contexte de l'alerte.",

    // Intégration (Onboarding)
    onboarding_step1_title: "Étape 1 : Votre Watchlist",
    onboarding_step1_content: "Tout commence ici. Cliquez pour créer votre première watchlist et choisir les paires que vous souhaitez surveiller.",
    onboarding_step2_title: "Étape 2 : Centre de Découverte",
    onboarding_step2_content: "Utilisez le scanner de marché pour trouver de nouvelles opportunités sur l'ensemble du marché lorsque votre watchlist est calme.",
    onboarding_step3_title: "Étape 3 : Poste de Pilotage",
    onboarding_step3_content: "C'est ici que vous choisissez et configurez la stratégie que le bot utilisera pour analyser vos paires.",
    onboarding_step4_title: "Étape 4 : Journal de Bord",
    onboarding_step4_content: "Suivez vos trades en cours, analysez vos performances passées et consultez les logs du bot ici.",
    onboarding_step5_title: "Étape 5 : Activer le Robot",
    onboarding_step5_content: "Une fois votre watchlist et votre stratégie configurées, cliquez ici pour activer le robot. Il commencera à analyser le marché pour vous en temps réel.",
    
    // Modale Finale d'Intégration
    onboarding_final_title: 'Bienvenue sur BotMonster !',
    onboarding_final_p1: 'Vous venez d\'ajouter vos premières paires, excellent !',
    onboarding_final_p2: 'Voici un aperçu rapide :',
    onboarding_final_li1: '<strong>Panneau Droit :</strong> Choisissez et configurez votre stratégie.',
    onboarding_final_li2: '<strong>Panneau Inférieur :</strong> Suivez vos trades et vos performances.',
    onboarding_final_li3: '<strong>Mode de Trading :</strong> Basculez entre Backtest, Papier et Live en haut.',
    onboarding_final_p3: 'Activez le robot avec le bouton <span class="text-red-400 font-bold">Robot OFF</span> pour commencer.',
    onboarding_final_button: 'Compris !',

    // Centre d'Aide
    help_category_analysis: "Analyse & Découverte",
    help_category_strategies: "Stratégies & Automatisation",
    help_category_trading: "Trading & Gestion",
    help_category_getting_started: "Premiers Pas",
    help_topic_scanner_title: "Scanner de Marché",
    help_topic_scanner_content: `
        <h4 class='font-bold text-sky-400 mb-2'>Objectif</h4>
        <p>Le Scanner de Marché est votre outil principal pour la <strong>découverte d'opportunités</strong>. Il analyse l'ensemble du marché pour ne présenter que les paires qui correspondent à vos critères spécifiques.</p>
        <h4 class='font-bold text-sky-400 mt-3 mb-2'>Comment ça marche</h4>
        <ul class='list-disc list-inside space-y-1'>
            <li><strong>Présélections :</strong> Créez et sauvegardez des configurations de filtres (volume, tendance, progression de stratégie) dans le Gestionnaire de Présélections.</li>
            <li><strong>Scan :</strong> Chargez une présélection et lancez le scan. Les paires correspondantes apparaîtront dans la liste de résultats.</li>
            <li><strong>Action :</strong> Cliquez sur un résultat pour voir son graphique ou l'ajouter directement à votre watchlist active.</li>
        </ul>
    `,
    help_topic_heatmap_title: "Heatmap",
    help_topic_heatmap_content: `
        <h4 class='font-bold text-sky-400 mb-2'>Objectif</h4>
        <p>La Heatmap fournit une <strong>vue d'ensemble visuelle et instantanée</strong> de toute votre watchlist sur plusieurs unités de temps.</p>
        <h4 class='font-bold text-sky-400 mt-3 mb-2'>Comment la lire</h4>
        <ul class='list-disc list-inside space-y-1'>
            <li><strong>Couleur :</strong> Le vert indique une tendance haussière (prix > EMA50), le rouge une tendance baissière. L'intensité de la couleur montre la force de la tendance.</li>
            <li><strong>Barre de Progression :</strong> La petite barre bleue en bas montre l'état d'avancement de la stratégie active pour cette paire/unité de temps.</li>
            <li><strong>Cercle Pulsant :</strong> Un cercle jaune pulsant met en évidence un setup "chaud", où une stratégie est proche de déclencher un signal d'entrée.</li>
        </ul>
    `,
    help_topic_presets_title: "Gestionnaire de Présélections",
    help_topic_presets_content: `
        <p>Le Gestionnaire de Présélections est l'endroit où vous créez et gérez vos filtres de scanner. Vous pouvez combiner plusieurs critères comme le volume minimum sur 24h, l'alignement de tendance sur des unités de temps spécifiques, et même filtrer par la progression de la stratégie pour trouver des setups très spécifiques sur l'ensemble du marché.</p>
    `,
    help_topic_alerts_title: "Centre d'Alertes",
    help_topic_alerts_content: `
        <p>Le Centre d'Alertes est votre flux de surveillance passive. Il enregistre tous les événements importants (signaux, prises de liquidité, atteintes de TP/SL) de votre stratégie active sur l'ensemble de votre watchlist. Cliquez sur n'importe quel événement pour sauter instantanément à ce moment précis sur le graphique en 'Mode Revue'.</p>
    `,
    help_topic_what_is_strategy_title: "Qu'est-ce qu'une Stratégie ?",
    help_topic_what_is_strategy_content: `
        <p>Une stratégie est un ensemble de règles que le robot suit pour analyser le marché. C'est le "cerveau" de l'opération. Chaque stratégie a une logique spécifique pour identifier les signaux d'entrée et des réglages prédéfinis pour la gestion du risque (Stop Loss, Take Profit).</p>
    `,
    help_topic_configuration_title: "Configuration",
    help_topic_configuration_content: `
        <p>Dans le panneau de droite, vous pouvez ajuster les paramètres de la stratégie active en temps réel. Les modifications sont sauvegardées automatiquement pour l'unité de temps sélectionnée. Vous pouvez également activer/désactiver la visibilité des indicateurs sur le graphique.</p>
    `,
    help_topic_optimization_title: "Optimisation",
    help_topic_optimization_content: `
        <p>En mode Backtest, le "Centre d'Optimisation" vous permet de tester une plage de valeurs pour un paramètre au lieu d'une seule. Par exemple, vous pouvez tester un ratio Risque:Récompense de 1.0 à 3.0 par pas de 0.5. Le système lancera un backtest pour chaque combinaison et vous montrera un résumé des réglages les plus performants.</p>
    `,
    help_topic_ai_generator_title: "Générateur IA",
    help_topic_ai_generator_content: `
        <p>Le Générateur de Stratégies par IA vous permet de décrire une idée de trading en texte clair. L'IA tentera alors de traduire votre idée en un fichier de stratégie complet et importable au format JSON. C'est une fonctionnalité avancée pour créer des stratégies personnalisées sans écrire de code.</p>
    `,
    help_topic_risk_management_title: "Gestion du Risque & 'R'",
    help_topic_risk_management_content: `
        <h4 class='font-bold text-sky-400 mb-2'>L'Unité 'R'</h4>
        <p>Votre "R", ou Unité de Risque, est le montant en argent que vous acceptez de perdre si un trade atteint son Stop Loss. Dans les paramètres, vous définissez cela comme un pourcentage de votre capital total (ex: 1%).</p>
        <h4 class='font-bold text-sky-400 mt-3 mb-2'>Dimensionnement Automatique de la Position</h4>
        <p>Le robot utilise votre 'R' pour calculer automatiquement la taille de position correcte pour chaque trade. Il répond à la question : <strong>"Combien dois-je acheter pour que si le prix va de mon entrée à mon Stop Loss, je perde exactement 1% de mon capital ?"</strong></p>
        <p>Cela signifie que votre risque est constant sur chaque trade, quelle que soit la distance de votre Stop Loss en termes de pourcentage.</p>
    `,
    help_topic_trade_lifecycle_title: "Cycle de Vie d'un Trade",
    help_topic_trade_lifecycle_content: `
        <p>Un trade passe par plusieurs étapes : Détection du Signal -> Calcul du Risque -> Confirmation Manuelle Optionnelle -> Gestion Active (Stop Suiveur) -> Clôture (TP, SL, ou Manuelle). Tous les trades clôturés sont enregistrés dans votre historique.</p>
    `,
    help_topic_modes_title: "Modes de Trading",
    help_topic_modes_content: `
        <ul class='list-disc list-inside space-y-1'>
            <li><strong>Backtest :</strong> Testez des stratégies sur des données historiques. Pas d'argent réel ou de papier utilisé.</li>
            <li><strong>Papier :</strong> Tradez en temps réel avec un compte simulé. Parfait pour s'entraîner et tester les performances futures.</li>
            <li><strong>Live :</strong> Tradez avec des fonds réels de votre compte d'échange connecté. À utiliser avec prudence.</li>
        </ul>
    `,
    help_topic_journal_title: "Journal & Historique",
    help_topic_journal_content: `
        <p>Le panneau inférieur est votre journal de bord. Ici, vous pouvez suivre les trades ouverts, revoir l'historique des trades clôturés pour la session en cours, voir vos performances de session globales, et consulter les rapports de backtest détaillés.</p>
    `,
    help_topic_first_steps_title: "Premiers Pas",
    help_topic_first_steps_content: `
        <ol class='list-decimal list-inside space-y-1'>
            <li>Utilisez le <strong>Gestionnaire de Watchlist</strong> (en haut à gauche) pour ajouter les paires de cryptomonnaies que vous souhaitez surveiller.</li>
            <li>Sélectionnez une <strong>Stratégie</strong> dans le panneau de droite et configurez ses paramètres.</li>
            <li>Choisissez un <strong>Mode de Trading</strong> (commencez avec Papier ou Backtest).</li>
            <li>Cliquez sur le bouton <strong>"Robot OFF"</strong> pour démarrer le moteur.</li>
        </ol>
    `,
    help_topic_glossary_title: "Glossaire",
    help_topic_glossary_content: `
        <ul class='list-disc list-inside space-y-1'>
            <li><strong>SMC :</strong> Smart Money Concepts. Une méthodologie de trading basée sur le suivi du flux d'ordres institutionnels.</li>
            <li><strong>FVG (Fair Value Gap) :</strong> Un déséquilibre sur le marché, souvent considéré comme un aimant à prix.</li>
            <li><strong>Prise de Liquidité :</strong> Lorsque le prix balaie au-dessus d'un plus haut ou en dessous d'un plus bas pour déclencher des stop-loss, avant de s'inverser.</li>
            <li><strong>ADX :</strong> Average Directional Index. Un indicateur qui mesure la force d'une tendance, pas sa direction.</li>
        </ul>
    `,

    // Messages de Log
    log_risk_trade_blocked: '[{{pair}}] Trade bloqué. Risque actuel ({{currentRisk}}) >= Risque max ({{maxRisk}}).',
    log_risk_trade_invalid: '[{{pair}}] Trade invalidé. Capital insuffisant ({{availableCapital}}) ou risque invalide.',
    'log_risk_position_size_blocked': '[{{pair}}] Signal ignoré. Taille de position calculée à zéro (vérifiez les réglages de risque, le placement du SL et le capital disponible).',
    log_trade_pending_confirmation: '[{{pair}}] Trade en attente de confirmation manuelle.',
    log_trade_opened_auto: '[{{pair}}] Trade ouvert automatiquement.',
    log_step_met: '[{{pair}}] Étape : {{details}}',
    log_signal_detected: '[{{pair}}] {{details}} - Signal détecté.',
    log_risk_max_positions: '[{{pair}}] Trade bloqué : Nombre maximal de positions ouvertes atteint ({{max}}).',

    // Modale des Paramètres
    settings_title: 'Paramètres',
    settings_tab_general: 'Général',
    settings_tab_risk: 'Trading & Risque',
    settings_tab_sound: 'Notifications Sonores',
    settings_language_label: 'Langue de l\'Interface',
    settings_language_help: 'Change la langue d\'affichage de l\'application.',
    settings_confirm_trades_label: 'Confirmer les Trades Manuellement',
    settings_bnb_fees_label: 'Utiliser BNB pour les Frais (25% de réduction)',
    settings_capital_label: 'Capital Total ($)',
    settings_capital_help: 'Le capital total utilisé pour le calcul du risque.',
    settings_risk_per_trade_label: 'Risque par Trade (%)',
    settings_risk_per_trade_help: 'Pourcentage du capital total à risquer sur une seule transaction.',
    settings_max_concurrent_risk_label: 'Risque Simultané Max (%)',
    settings_max_concurrent_risk_help: 'Risque total maximal sur l\'ensemble des positions ouvertes.',
    settings_commission_label: 'Commission par Trade (%)',
    settings_commission_help: 'Frais de commission de l\'échange par transaction.',
    settings_slippage_label: 'Slippage (%)',
    settings_slippage_help: 'Slippage de prix estimé pour les ordres au marché dans les backtests.',
    sound_on_entry: 'Sur Signal d\'Entrée',
    sound_on_grab: 'Sur Prise de Liquidité',
    sound_on_tp: 'Sur Take Profit',
    sound_on_sl: 'Sur Stop Loss',
    sound_none: 'Aucun',
    sound_chime: 'Carillon',
    sound_notify: 'Notification',
    sound_success: 'Succès',
    sound_buzz: 'Buzzer',
    settings_sound_test: 'Tester',
    settings_logs_title: 'Logs de Session',
    settings_logs_help: 'Si vous rencontrez un bug, vous pouvez télécharger les logs de votre session actuelle ici et les envoyer au développeur pour analyse.',
    settings_logs_download_button: 'Télécharger les Logs de Session',
    settings_capital_mode_label: 'Mode de Gestion du Capital',
    settings_capital_mode_pro: 'Pro (Risque %)',
    settings_capital_mode_simple: 'Simplifié (Montant Fixe)',
    settings_fixed_amount_label: 'Montant par Position ($)',
    settings_max_positions_label: 'Nombre Max de Positions Ouvertes',
    settings_tab_social: 'Réseaux Sociaux',
    settings_social_help: 'Configurez vos réseaux sociaux pour activer les futures fonctionnalités de partage.',

    // Modales
    confirm_live_title: 'Activer le Trading en Direct ?',
    confirm_live_p1: "Vous êtes sur le point d'entrer en mode Trading en Direct. Toute transaction exécutée par la stratégie utilisera des <strong>fonds réels</strong> de votre compte d'échange connecté.",
    confirm_live_p2: "Veuillez vous assurer de bien comprendre les risques. BotMonster n'est pas responsable des pertes financières.",
    confirm_live_button: 'Confirmer & Passer en Direct',
    
    trade_confirm_title: "Confirmer l'Entrée en Position",
    trade_confirm_pair: "Paire :",
    trade_confirm_direction: "Direction :",
    trade_confirm_entry: "Prix d'Entrée (est.) :",
    trade_confirm_tp: "Take Profit (TP) :",
    trade_confirm_sl: "Stop Loss (SL) :",
    trade_confirm_button: 'Confirmer le Trade',
    
    watchlist_title: "Gérer les Watchlists",
    watchlist_subtitle: "Organisez vos paires dans des listes personnalisées.",
    watchlist_active: "Watchlist Active",
    watchlist_new_name_placeholder: "Nom de la watchlist...",
    watchlist_create_new_tooltip: "Créer une nouvelle watchlist",
    watchlist_delete_tooltip: "Supprimer la watchlist active",
    watchlist_content_title: "Contenu ({{count}})",
    watchlist_empty: "Votre watchlist est vide.",
    discover_pairs_title: "Découvrir des Paires",
    add_top_10_volume: "Ajouter Top 10 Volume",
    add_top_10_gainers: "Ajouter Top 10 Gagnants",
    add_top_10_losers: "Ajouter Top 10 Perdants",
    search_pair_placeholder: "Rechercher une paire...",
    sort_volume: "Volume",
    sort_gainers: "Gagnants",
    sort_losers: "Perdants",
    header_price: "Prix",
    header_change_24h: "Variation 24h",
    error_delete_last_watchlist: "Vous ne pouvez pas supprimer la dernière watchlist.",
    confirm_delete_watchlist: "Êtes-vous sûr de vouloir supprimer la watchlist \"{{name}}\" ?",

    backtest_summary_title: "Résumé du Backtest",
    backtest_summary_equity_tooltip: "Capital : ${{value}}",
    backtest_summary_no_trades: "Aucun trade n'a été exécuté durant cette session.",
    backtest_summary_pnl_dist_title: "Distribution des P&L",
    backtest_summary_pnl_dist_label: "Nombre de Trades",
    stat_duration_title: "Durées des Positions",
    stat_avg_duration: "Moyenne :",
    stat_avg_win_duration: "Moy. Gagnante :",
    stat_avg_loss_duration: "Moy. Perdante :",
    stat_performance_title: "Performance",
    stat_best_trade: "Meilleur Trade :",
    stat_worst_trade: "Pire Trade :",
    stat_avg_rr: "R:R Réalisé Moy. :",
    stat_win_streak: "Plus Longue Série de Gains",
    stat_loss_streak: "Plus Longue Série de Pertes",
    backtest_summary_settings_title: "Paramètres Utilisés",

    opt_title: "Résultats de l'Optimisation",
    opt_profit_net: "Profit Net",
    opt_win_rate: "Taux de Réussite",
    opt_trades: "Trades",
    opt_profit_factor: "Facteur de Profit",
    opt_max_drawdown: "Drawdown Max",
    opt_action: "Action",
    opt_apply: "Appliquer",
    opt_popover_title: "Optimiser le Paramètre",
    opt_popover_start: "Début",
    opt_popover_end: "Fin",
    opt_popover_step: "Pas",
    setting_optimized: "Configuré",
    setting_optimize: "Optimiser",
    optimization_summary_line: 'Optimisation : de {{start}} à {{end}} par pas de {{step}}.',

    session_summary_title: "Résumé de la Session de Trading",
    session_summary_no_trades: "Aucun trade clôturé durant cette session.",
    download_log_button: "Télécharger le journal",

    session_start_title: "Reprendre la Session de Trading ?",
    session_start_p1: "Nous avons détecté {{count}} position(s) ouverte(s) en mode {{mode}}.",
    session_start_p2: "Que souhaitez-vous faire ?",
    session_start_option1_title: "Reprendre la Session Précédente (Recommandé)",
    session_start_option1_desc: "Continuez à gérer vos positions ouvertes et ajoutez de nouveaux trades à la session existante.",
    session_start_option2_title: "Nouvelle Session (Garder les Positions)",
    session_start_option2_desc: "Démarrez une nouvelle session de statistiques, mais gardez et continuez à gérer vos positions actuelles.",
    session_start_option3_title: "Nouvelle Session (Fermer les Positions)",
    session_start_option3_desc: "Fermez toutes les positions ouvertes au prix du marché et recommencez à zéro.",

    robot_stop_title: "Positions Ouvertes Détectées",
    robot_stop_p1: "Vous avez {{count}} position(s) ouverte(s) en mode {{mode}}.",
    robot_stop_p2: "Avant d'arrêter le robot, veuillez choisir comment gérer ces positions.",
    robot_stop_option1_title: "Fermer les Positions & Arrêter",
    robot_stop_option1_desc: "Ferme toutes les positions ouvertes au prix du marché et termine la session.",
    robot_stop_option2_title: "Garder les Positions & Arrêter",
    robot_stop_option2_desc: "Le robot s'arrête, mais vos positions restent ouvertes pour une gestion manuelle.",
    
    welcome_title: 'Bienvenue sur BotMonster !',
    welcome_p1: 'Prêt à transformer le bruit du marché en signaux clairs ?',
    welcome_p2: 'Laissez-nous vous guider à travers les fonctionnalités principales en moins d\'une minute.',
    welcome_start_tour: 'Commencer la Visite Guidée',
    welcome_explore_self: 'Je connais déjà',
    
    strategy_info_title: "Informations sur la Stratégie",

    chart_loading_strategy: "Chargement de la stratégie...",
    chart_loading_backtest_data: "Chargement des données de backtest...",
    chart_loading_market_data: "Chargement des données de marché...",

    ai_panel_title: "Analyse de Marché par IA",
    analyze_with_ai_tooltip: "Analyser le graphique actuel avec l'IA",

    backtest_controls_speed: "Vitesse :",
    play: 'Lecture',
    pause: 'Pause',
    step_forward: 'Avancer',
    step_backward: 'Reculer',
    
    preset_manager_title: "Atelier de Configuration des Présélections",
    preset_manager_select_prompt: "Sélectionnez une présélection pour la modifier ou en créer une nouvelle.",
    preset_name_label: "Nom de la Présélection",
    strategy_state_filter_label: "Filtre d'État de Stratégie",
    new_preset_default_name: "Nouvelle Présélection",
    preset_manager_volume_label: 'Volume Min 24h ($)',
    preset_manager_trend_filter_label: 'Filtre de Tendance (EMA 50)',
    preset_manager_trend_direction_any: 'Toutes',
    preset_manager_trend_direction_bullish: 'Haussière',
    preset_manager_strategy_filter_none: 'Aucune stratégie',
    preset_manager_strategy_filter_any_step: 'N\'importe quelle étape',
    preset_manager_strategy_filter_step_label: '≥ Étape {{step}} : {{name}}',
    preset_manager_new_preset_button: 'Créer une Nouvelle',

    help_modal_title: "Aide : {{title}}",
    help_for_section_tooltip: "Aide pour {{title}}",

    gemini_no_chart_data: "Aucune donnée de graphique disponible pour {{pair}} sur l'unité de temps {{timeframe}}.",
    gemini_recent_events: "Événements significatifs récents sur le graphique :\n",
    gemini_event_ob: "Order Block (OB)",
    gemini_event_fvg: "Fair Value Gap (FVG) entre {{bottom}} et {{top}}",
    gemini_event_liquidity_grab: "Prise de Liquidité",
    gemini_candle_date: "Bougie du {{date}}",
    gemini_error_no_key: "La clé API Gemini n'est pas configurée.",
    gemini_system_instruction: `Vous êtes un analyste de trading de classe mondiale spécialisé dans les concepts d'order flow comme les Order Blocks (OB), les Fair Value Gaps (FVG) et la liquidité. Votre nom est BotMonster.
  - Analysez le contexte de marché fourni, en tenant compte de la paire ({{pair}}) et de l'unité de temps ({{timeframe}}).
  - Fournissez une analyse concise et professionnelle au format markdown.
  - Structurez votre réponse avec un "### Scénario Haussier" et un "### Scénario Baissier".
  - Pour chaque scénario, expliquez votre raisonnement en vous basant sur les données fournies (OB, FVG, etc.) et l'unité de temps.
  - Gardez votre analyse brève et pertinente. Concentrez-vous sur l'action potentielle des prix.
  - Ne mentionnez pas que vous êtes une IA. Répondez exclusivement dans la langue de la requête.`,
    gemini_error_invalid_key: "La clé API Gemini fournie n'est pas valide. Veuillez vérifier votre configuration.",
    gemini_error_api_fail: "Échec de la communication avec l'API Gemini.",
    binance_fetch_batch: "Récupération du lot {{batch}} sur ~{{total}}...",
    binance_finalizing_data: "Finalisation des données...",
    binance_fetch_chunk_fail: "Échec de la récupération d'un bloc de données historiques. Veuillez réessayer.",

    backtest_period_default: 'Par défaut (1000 bougies)',
    backtest_period_3m: '3 derniers mois',
    backtest_period_1y: '1 an',
    backtest_period_2y: '2 ans',
    backtest_period_all: 'Maximum (depuis 2021)',
    
    comparison_modal_title: 'Comparaison de Backtests',
    comparison_session_a: 'Session A',
    comparison_session_b: 'Session B',
    comparison_settings_title: 'Paramètres Comparés',
    
    setting_value_enabled: 'Activé',
    setting_value_disabled: 'Désactivé',
    
    heatmap_tab_title: 'Heatmap',
    heatmap_panel_title: 'Heatmap du Marché',
    heatmap_pair_header: 'Paire',
    heatmap_loading: 'Calcul des données de la heatmap...',
    heatmap_tooltip_trend: 'Tendance vs EMA50',
    heatmap_tooltip_progress: 'Progression de la Stratégie',

    copilot_title: 'Copilote de Stratégie IA',
    copilot_prompt_placeholder: 'Décrivez votre objectif de trading... ex: "Je cherche une stratégie de scalping plus agressive pour BTC pendant la session de Londres"',
    copilot_generate_button: 'Générer les réglages',
    copilot_generating: 'Génération en cours...',
    copilot_suggestion_title: 'Proposition de l\'IA',
    copilot_ai_reasoning: 'Raisonnement de l\'IA',
    copilot_setting_changes: 'Changements de Réglages',
    copilot_apply_button: 'Appliquer ces réglages',
    copilot_quick_backtest_button: 'Lancer un Backtest Rapide',
    copilot_no_suggestions: 'L\'IA n\'a pas pu générer de suggestion pour cette demande.',
    copilot_error: 'Erreur du copilote : {{message}}',
    copilot_error_unknown: "Une erreur inconnue s'est produite lors de la génération des suggestions.",

    debrief_button_tooltip: 'Débriefer ce trade avec l\'IA',
    debrief_loading: 'Analyse en cours...',
    debrief_title: 'Analyse de Trade par IA',
    debrief_strong_points: 'Points Forts',
    debrief_improvements: 'Axes d\'Amélioration',
    debrief_error: 'Erreur lors de l\'analyse du trade.',
    debrief_error_no_data: "Données graphiques insuffisantes autour du trade pour l'analyse.",

    market_regime_trending: 'Tendance Forte',
    market_regime_ranging: 'Range',
    market_regime_volatile: 'Haute Volatilité',
    market_regime_reason_trending: 'L\'ADX(14) est à {{adx}}, indiquant une forte tendance.',
    market_regime_reason_ranging: 'L\'ADX(14) est à {{adx}}, indiquant un marché en range.',
    
    // Sessions de Marché
    session_tokyo: 'Session de Tokyo',
    session_london: 'Session de Londres',
    session_ny: 'Session de New York',
    session_overlap_tky_ldn: 'Superposition Tokyo / Londres',
    session_overlap_ldn_ny: 'Superposition Londres / New York',
    session_off_hours: 'Hors Session',
    session_volatility_very_low: 'Très faible volatilité attendue',
    session_volatility_low: 'Faible volatilité attendue',
    session_volatility_medium: 'Volatilité modérée attendue',
    session_volatility_high: 'Forte volatilité attendue',
    
    gemini_system_instruction_copilot: `Vous êtes un expert en optimisation de stratégies de trading. L'utilisateur souhaite ajuster les paramètres de sa stratégie actuelle en fonction d'un objectif.
Stratégie Actuelle : {{strategyName}}
Paire Actuelle : {{pair}}
Unité de Temps Actuelle : {{timeframe}}
Paramètres Actuels : {{settings}}
Langue de l'Utilisateur : {{language}}

Votre tâche est d'analyser la demande de l'utilisateur et de suggérer de nouveaux paramètres.
Vous DEVEZ répondre avec un objet JSON valide au format : { "settings": { "paramToChange": newValue, ... }, "rationale": "Votre raisonnement pour les changements, écrit dans la langue de l'utilisateur." }
L'objet "settings" ne doit contenir que les paramètres que vous souhaitez modifier par rapport aux paramètres actuels.
Le "rationale" doit être une explication brève et conviviale.`,
    
    // Gestionnaire de Stratégies
    strategy_manager_title: "Gestionnaire de Stratégies",
    strategy_manager_add_button: "+ Ajouter une Stratégie",
    strategy_manager_built_in: "Stratégies Intégrées",
    strategy_manager_my_strategies: "Mes Stratégies",
    strategy_manager_select_prompt: "Sélectionnez une stratégie à gauche pour voir ses détails.",
    import_strategy_subtitle: "Importer une stratégie depuis un fichier .json.",
    confirm_delete_strategy: "Êtes-vous sûr de vouloir supprimer la stratégie '{{name}}' ?",
    error_delete_active_strategy: "Vous ne pouvez pas supprimer la stratégie actuellement active.",

    // Générateur de Stratégies IA
    ai_strategy_generator_trigger_button: "Générer avec l'IA",
    ai_strategy_generator_title: "Générateur de Stratégies par IA",
    ai_strategy_generator_subtitle: "Décrivez votre idée de stratégie en langage naturel. L'IA la construira pour vous au format JSON, prête à être importée.",
    ai_strategy_generator_prompt_placeholder: "Exemple : Une stratégie de suivi de tendance qui achète sur un croisement doré des EMA 50 et 200 lorsque l'ADX est supérieur à 25...",
    ai_strategy_generator_result_title: "Stratégie Générée",
    ai_strategy_generator_import_button: "Importer cette Stratégie",
    ai_strategy_generator_generating_button: "Génération...",
    ai_strategy_generator_generate_button: "Générer la Stratégie",
    ai_strategy_generator_available_indicators: "Indicateurs Disponibles",
    
    // Erreurs & Succès d'Import/Export
    error_import_invalid_json: "Impossible d'analyser le fichier de stratégie. Assurez-vous qu'il s'agit d'un JSON valide.",
    error_import_missing_fields: "Échec de l'importation. Le JSON de la stratégie ne contient pas les champs requis : {{fields}}.",
    error_import_invalid_id: "Échec de l'importation. Une stratégie avec l'ID '{{id}}' existe déjà.",
    error_import_failed: "Échec de l'importation de la stratégie : {{message}}.",
    import_strategy_success: "Stratégie importée avec succès : {{name}}.",
    error_generate_strategy: "L'IA n'a pas pu générer une stratégie valide à partir de la description.",
};
