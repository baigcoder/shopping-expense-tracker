# Graph Report - shopping-expense-tracker (2026-05-01)

## Corpus Check

- 306 files · ~455,591 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 4992 nodes · 10503 edges · 90 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 179 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Community 225|Community 225]]
- [[_COMMUNITY_Community 226|Community 226]]
- [[_COMMUNITY_Community 227|Community 227]]
- [[_COMMUNITY_Community 228|Community 228]]
- [[_COMMUNITY_Community 229|Community 229]]
- [[_COMMUNITY_Community 230|Community 230]]
- [[_COMMUNITY_Community 231|Community 231]]
- [[_COMMUNITY_Community 232|Community 232]]
- [[_COMMUNITY_Community 233|Community 233]]
- [[_COMMUNITY_Community 234|Community 234]]
- [[_COMMUNITY_Community 235|Community 235]]

## God Nodes (most connected - your core abstractions)

1. `warn()` - 154 edges
2. `ConfigNamespace` - 141 edges
3. `TemplateNamespace` - 115 edges
4. `shadow()` - 101 edges
5. `getStringOption()` - 85 edges
6. `Catalog` - 47 edges
7. `unreachable()` - 41 edges
8. `PartialEvaluator` - 41 edges
9. `XFAObject` - 41 edges
10. `getInteger()` - 38 edges

## Surprising Connections (you probably didn't know these)

- `updateCard()` --calls--> `handleToggleFreeze()` [INFERRED]
  backend\src\controllers\cardController.ts → frontend\src\pages\CardsPage.tsx
- `updateCard()` --calls--> `handleSetDefault()` [INFERRED]
  backend\src\controllers\cardController.ts → frontend\src\pages\CardsPage.tsx
- `updateCard()` --calls--> `handleSaveNickname()` [INFERRED]
  backend\src\controllers\cardController.ts → frontend\src\pages\CardsPage.tsx
- `updateCard()` --calls--> `handleSaveLimit()` [INFERRED]
  backend\src\controllers\cardController.ts → frontend\src\pages\CardsPage.tsx
- `updateCard()` --calls--> `handleSaveCvvPassword()` [INFERRED]
  backend\src\controllers\cardController.ts → frontend\src\pages\CardsPage.tsx

## Communities

### Community 0 - "Community 0"

Cohesion: 0.0
Nodes (454): A, AbortException, Acrobat, Acrobat7, ADBE_JSConsole, ADBE_JSDebugger, addHTML(), AddSilentPrint (+446 more)

### Community 1 - "Community 1"

Cohesion: 0.01
Nodes (107): addCachedImageOps(), addChildren(), adjustMapping(), Annotation, AnnotationBorderStyle, AnnotationFactory, AppearanceStreamEvaluator, buildHuffmanTable() (+99 more)

### Community 2 - "Community 2"

Cohesion: 0.01
Nodes (74): addHex(), adjustWidths(), AESBaseCipher, Ascii85Stream, AsciiHexStream, AstNode, BaseLocalCache, BasePdfManager (+66 more)

### Community 3 - "Community 3"

Cohesion: 0.02
Nodes (144): verifyToken(), decryptPassword(), encryptPassword(), resendOTP(), sendSignupOTP(), verifyOTP(), requestResetOTP(), textToSpeech() (+136 more)

### Community 4 - "Community 4"

Cohesion: 0.02
Nodes (64): applyAssist(), ariaLabel(), B, BooleanElement, Br, calculateSHA384(), calculateSHA512(), Caption (+56 more)

### Community 5 - "Community 5"

Cohesion: 0.01
Nodes (40): captureError(), clearUserContext(), initSentry(), noopMiddleware(), setUserContext(), csrfProtection(), csrfTokenMiddleware(), csrfValidationMiddleware() (+32 more)

### Community 6 - "Community 6"

Cohesion: 0.03
Nodes (115): handleFileSelect(), processDocument(), fetchAccounts(), handleDisconnect(), handleSync(), confirmReset(), getAuthToken(), requestOTP() (+107 more)

### Community 7 - "Community 7"

Cohesion: 0.01
Nodes (32): extract_tables_from_pdf(), extract_text_from_csv(), extract_text_from_pdf(), is_valid_description(), list_voices(), parse_document(), parse_table_transactions(), parse_transactions_regex() (+24 more)

### Community 8 - "Community 8"

Cohesion: 0.02
Nodes (32): assert(), CalRGBCS, ContextCache, convertBlackAndWhiteToRGBA(), convertToRGBA(), CssFontInfo, decodeBitmap(), decodeIAID() (+24 more)

### Community 9 - "Community 9"

Cohesion: 0.01
Nodes (4): ConfigNamespace, LZWStream, PostScriptEvaluator, PostScriptStack

### Community 10 - "Community 10"

Cohesion: 0.03
Nodes (55): handleKeyPress(), handleSend(), handleClose(), handleSubmit(), guessCategory(), handleConfirm(), parseReceiptText(), resetScanner() (+47 more)

### Community 11 - "Community 11"

Cohesion: 0.04
Nodes (21): cleanRecord(), FirebaseQueryBuilder, getTable(), logout(), readTableRows(), signInWithEmail(), signInWithGoogle(), signUpWithEmail() (+13 more)

### Community 12 - "Community 12"

Cohesion: 0.06
Nodes (10): CFFCompiler, CFFDict, CFFOffsetTracker, CFFParser, CFFPrivateDict, CFFStrings, CFFTopDict, parseIndex() (+2 more)

### Community 13 - "Community 13"

Cohesion: 0.05
Nodes (9): ChunkedStream, ChunkedStreamManager, MessageHandler, NetworkPdfManager, PDFWorkerStream, PDFWorkerStreamRangeReader, PDFWorkerStreamReader, WorkerMessageHandler (+1 more)

### Community 14 - "Community 14"

Cohesion: 0.1
Nodes (21): checkCancellation(), checkCheckoutURL(), checkPaymentForms(), checkSuccessElements(), debounce(), generateTransactionHash(), getCachedAnalysis(), handleClick() (+13 more)

### Community 15 - "Community 15"

Cohesion: 0.1
Nodes (21): checkCancellation(), checkCheckoutURL(), checkPaymentForms(), checkSuccessElements(), debounce(), generateTransactionHash(), getCachedAnalysis(), handleClick() (+13 more)

### Community 16 - "Community 16"

Cohesion: 0.09
Nodes (20): checkCancellation(), checkCheckoutURL(), checkPaymentForms(), checkSuccessElements(), debounce(), generateTransactionHash(), getCachedAnalysis(), handleClick() (+12 more)

### Community 17 - "Community 17"

Cohesion: 0.09
Nodes (20): checkCancellation(), checkCheckoutURL(), checkPaymentForms(), checkSuccessElements(), debounce(), generateTransactionHash(), getCachedAnalysis(), handleClick() (+12 more)

### Community 18 - "Community 18"

Cohesion: 0.06
Nodes (37): handleFileSelect(), processFile(), handleExport(), handleDrop(), handleFileSelect(), processFile(), detectCategory(), extractMerchant() (+29 more)

### Community 19 - "Community 19"

Cohesion: 0.12
Nodes (33): broadcastTransaction(), categorizeSite(), error(), fetchWithTimeout(), getCategoryFromStore(), getCategoryIcon(), getSiteVisits(), handleBehaviorTransaction() (+25 more)

### Community 20 - "Community 20"

Cohesion: 0.12
Nodes (33): broadcastTransaction(), categorizeSite(), error(), fetchWithTimeout(), getCategoryFromStore(), getCategoryIcon(), getSiteVisits(), handleBehaviorTransaction() (+25 more)

### Community 21 - "Community 21"

Cohesion: 0.08
Nodes (8): AlternateCS, DefaultAppearanceEvaluator, DeviceRgbaCS, getUint8ArrayMemory0(), IccColorSpace, IndexedCS, JpegImage, passArray8ToWasm0()

### Community 22 - "Community 22"

Cohesion: 0.08
Nodes (4): Builder, DatasetXMLParser, XFAParser, XMLParserBase

### Community 23 - "Community 23"

Cohesion: 0.06
Nodes (5): Color, Commands, getTransformMatrix(), Stipple, Util

### Community 24 - "Community 24"

Cohesion: 0.08
Nodes (7): AstArgument, AstBinaryOperation, AstLiteral, AstMin, AstVariable, AstVariableDefinition, ExpressionBuilderVisitor

### Community 25 - "Community 25"

Cohesion: 0.08
Nodes (1): LocaleSetNamespace

### Community 26 - "Community 26"

Cohesion: 0.1
Nodes (3): CalGrayCS, DeviceCmykCS, LabCS

### Community 27 - "Community 27"

Cohesion: 0.11
Nodes (5): handleResize(), handleStorageChange(), handleVisibilityChange(), isMobileDevice(), ExtensionService

### Community 28 - "Community 28"

Cohesion: 0.28
Nodes (18): attemptReconnect(), canSync(), dispatchTransaction(), generateMessageId(), handleConnectionError(), hasAlreadySyncedInSession(), markAsSynced(), normalizeExtensionTransaction() (+10 more)

### Community 29 - "Community 29"

Cohesion: 0.28
Nodes (18): attemptReconnect(), canSync(), dispatchTransaction(), generateMessageId(), handleConnectionError(), hasAlreadySyncedInSession(), markAsSynced(), normalizeExtensionTransaction() (+10 more)

### Community 30 - "Community 30"

Cohesion: 0.17
Nodes (16): appendChatHistory(), clearChatHistory(), deleteCache(), getCache(), getCachedForecast(), getCachedInsights(), getCachedRisks(), getCachedUserContext() (+8 more)

### Community 31 - "Community 31"

Cohesion: 0.35
Nodes (17): $(), apiFetch(), bind(), clipPage(), formatCurrency(), getAuth(), getCurrentSite(), loadMain() (+9 more)

### Community 32 - "Community 32"

Cohesion: 0.21
Nodes (16): attemptReconnect(), canSync(), dispatchTransaction(), generateMessageId(), handleConnectionError(), hasAlreadySyncedInSession(), markAsSynced(), normalizeExtensionTransaction() (+8 more)

### Community 33 - "Community 33"

Cohesion: 0.21
Nodes (16): attemptReconnect(), canSync(), dispatchTransaction(), generateMessageId(), handleConnectionError(), hasAlreadySyncedInSession(), markAsSynced(), normalizeExtensionTransaction() (+8 more)

### Community 34 - "Community 34"

Cohesion: 0.12
Nodes (4): getCardGradient(), getCardGradient(), getBrandGradient(), getThemeById()

### Community 35 - "Community 35"

Cohesion: 0.27
Nodes (17): $(), apiFetch(), bind(), clipPage(), formatCurrency(), getAuth(), getCurrentSite(), loadMain() (+9 more)

### Community 36 - "Community 36"

Cohesion: 0.27
Nodes (17): $(), apiFetch(), bind(), clipPage(), formatCurrency(), getAuth(), getCurrentSite(), loadMain() (+9 more)

### Community 37 - "Community 37"

Cohesion: 0.27
Nodes (17): $(), apiFetch(), bind(), clipPage(), formatCurrency(), getAuth(), getCurrentSite(), loadMain() (+9 more)

### Community 38 - "Community 38"

Cohesion: 0.27
Nodes (17): $(), apiFetch(), bind(), clipPage(), formatCurrency(), getAuth(), getCurrentSite(), loadMain() (+9 more)

### Community 39 - "Community 39"

Cohesion: 0.2
Nodes (13): calculateNextDueDate(), checkAndNotify(), createReminder(), downloadCalendarEvent(), formatICSDate(), generateCalendarEvent(), getOverdueReminders(), getReminders() (+5 more)

### Community 41 - "Community 41"

Cohesion: 0.19
Nodes (6): updateCard(), handleSaveCvvPassword(), handleSaveLimit(), handleSaveNickname(), handleSetDefault(), handleToggleFreeze()

### Community 42 - "Community 42"

Cohesion: 0.14
Nodes (1): ConnectionSetNamespace

### Community 43 - "Community 43"

Cohesion: 0.23
Nodes (1): SoundManager

### Community 44 - "Community 44"

Cohesion: 0.21
Nodes (7): AppError, getErrorMessage(), isAxiosError(), logError(), NetworkError, parseError(), ValidationError

### Community 45 - "Community 45"

Cohesion: 0.2
Nodes (4): checkStatus(), fetchSiteVisits(), handleStorageChange(), handleExtensionUpdate()

### Community 46 - "Community 46"

Cohesion: 0.23
Nodes (1): AIDataCacheService

### Community 47 - "Community 47"

Cohesion: 0.2
Nodes (2): NullOptimizer, QueueOptimizer

### Community 48 - "Community 48"

Cohesion: 0.25
Nodes (1): BillService

### Community 49 - "Community 49"

Cohesion: 0.29
Nodes (1): NotificationSoundService

### Community 50 - "Community 50"

Cohesion: 0.33
Nodes (9): analyzeRecurringPatterns(), detectFrequency(), getBillsDueSoon(), getHighValueUpcoming(), getTotalUpcomingExpenses(), getUpcomingBills(), isLikelySubscription(), normalizeMerchantName() (+1 more)

### Community 51 - "Community 51"

Cohesion: 0.53
Nodes (9): build(), buildChrome(), buildEdge(), buildFirefox(), copyCommonFiles(), copyDir(), copyFile(), createZip() (+1 more)

### Community 52 - "Community 52"

Cohesion: 0.22
Nodes (2): handleFileImport(), fetchData()

### Community 53 - "Community 53"

Cohesion: 0.31
Nodes (4): fetchGoals(), handleDelete(), handleGoalChange(), handleSubmit()

### Community 55 - "Community 55"

Cohesion: 0.71
Nodes (6): buildChrome(), buildFirefox(), copyDir(), copyFile(), createZip(), ensureDir()

### Community 56 - "Community 56"

Cohesion: 0.25
Nodes (1): XFAAttribute

### Community 57 - "Community 57"

Cohesion: 0.32
Nodes (3): handleCardNumberChange(), isValidCardNumber(), validate()

### Community 58 - "Community 58"

Cohesion: 0.39
Nodes (5): handleSave(), createImage(), getCroppedImg(), getRadianAngle(), rotateSize()

### Community 59 - "Community 59"

Cohesion: 0.43
Nodes (6): closeModal(), fetchAccounts(), handleDelete(), handleRefresh(), handleSubmit(), handleUpdateBalance()

### Community 60 - "Community 60"

Cohesion: 0.39
Nodes (2): EmailNotificationService, isNotificationEnabled()

### Community 61 - "Community 61"

Cohesion: 0.32
Nodes (1): MerchantCategorizationService

### Community 62 - "Community 62"

Cohesion: 0.38
Nodes (1): SingleIntersector

### Community 63 - "Community 63"

Cohesion: 0.38
Nodes (4): SyncStatusIndicator(), useDashboardRealtime(), useRealtimeSync(), useTransactionRealtime()

### Community 67 - "Community 67"

Cohesion: 0.43
Nodes (4): fetchSubscriptions(), handleAdd(), handleCancel(), handleSubscriptionChange()

### Community 68 - "Community 68"

Cohesion: 0.48
Nodes (5): buildFinancialContext(), callBackendAI(), generateFinancialInsight(), generateRiskAdvice(), generateSpendingAnalysis()

### Community 69 - "Community 69"

Cohesion: 0.47
Nodes (3): sanitizeAIInput(), sanitizeChatMessage(), sanitizeContext()

### Community 70 - "Community 70"

Cohesion: 0.33
Nodes (2): PrivacyPolicyPage(), DatasetsNamespace

### Community 71 - "Community 71"

Cohesion: 0.47
Nodes (1): Intersector

### Community 72 - "Community 72"

Cohesion: 0.4
Nodes (2): AES128Cipher, AES256Cipher

### Community 73 - "Community 73"

Cohesion: 0.53
Nodes (4): detectPurchase(), extractPurchaseData(), getSiteConfig(), showNotification()

### Community 75 - "Community 75"

Cohesion: 0.6
Nodes (5): addRule(), approve(), bulk(), load(), reject()

### Community 76 - "Community 76"

Cohesion: 0.7
Nodes (3): get(), loadConfigFromStorage(), saveConfigToStorage()

### Community 77 - "Community 77"

Cohesion: 0.7
Nodes (3): get(), loadConfigFromStorage(), saveConfigToStorage()

### Community 80 - "Community 80"

Cohesion: 0.6
Nodes (3): handleClose(), handleSubmit(), resetForm()

### Community 84 - "Community 84"

Cohesion: 0.7
Nodes (3): emitFinancialDataEvent(), getBroadcastChannel(), setupInboundBroadcastListener()

### Community 87 - "Community 87"

Cohesion: 0.67
Nodes (2): get(), loadConfigFromStorage()

### Community 88 - "Community 88"

Cohesion: 0.67
Nodes (2): get(), loadConfigFromStorage()

### Community 103 - "Community 103"

Cohesion: 1.0
Nodes (2): handleDataChange(), loadData()

### Community 112 - "Community 112"

Cohesion: 0.67
Nodes (1): ValidationError

### Community 113 - "Community 113"

Cohesion: 0.67
Nodes (1): AppError

### Community 225 - "Community 225"

Cohesion: 1.0
Nodes (1): Extract tables from PDF using pdfplumber Best for structured bank statement

### Community 226 - "Community 226"

Cohesion: 1.0
Nodes (1): Validate that a description is meaningful, not a fragment Rejects: ': PM',

### Community 227 - "Community 227"

Cohesion: 1.0
Nodes (1): Enhanced transaction parsing from extracted table rows - Properly extracts

### Community 228 - "Community 228"

Cohesion: 1.0
Nodes (1): Extract text AND tables from PDF - supports multiple pages Returns: (text,

### Community 229 - "Community 229"

Cohesion: 1.0
Nodes (1): Extract text from CSV file

### Community 230 - "Community 230"

Cohesion: 1.0
Nodes (1): Use Groq AI to extract transactions from text

### Community 231 - "Community 231"

Cohesion: 1.0
Nodes (1): Improved regex-based transaction parsing Extracts: name, date, amount, send

### Community 232 - "Community 232"

Cohesion: 1.0
Nodes (1): Parse a document (PDF, image, or CSV) and extract transactions

### Community 233 - "Community 233"

Cohesion: 1.0
Nodes (1): List available TTS voices

### Community 234 - "Community 234"

Cohesion: 1.0
Nodes (1): Convert text to speech using Microsoft's FREE neural voices Returns MP3 aud

### Community 235 - "Community 235"

Cohesion: 1.0
Nodes (1): Stream TTS audio (for direct <audio> src)

## Knowledge Gaps

- **23 isolated node(s):** `AI Document Parser Server FastAPI server for extracting text and transactions f`, `Extract tables from PDF using pdfplumber     Best for structured bank statement`, `Validate that a description is meaningful, not a fragment     Rejects: ': PM',`, `Enhanced transaction parsing from extracted table rows     - Properly extracts`, `Extract text AND tables from PDF - supports multiple pages     Returns: (text,` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 25`** (26 nodes): `LocaleSetNamespace`, `.calendarSymbols()`, `.currencySymbol()`, `.currencySymbols()`, `.datePattern()`, `.datePatterns()`, `.dateTimeSymbols()`, `.day()`, `.dayNames()`, `.era()`, `.eraNames()`, `.locale()`, `.localeSet()`, `.meridiem()`, `.meridiemNames()`, `.month()`, `.monthNames()`, `.numberPattern()`, `.numberPatterns()`, `.numberSymbol()`, `.numberSymbols()`, `.[Qs]()`, `.timePattern()`, `.timePatterns()`, `.typeFace()`, `.typeFaces()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (14 nodes): `ConnectionSetNamespace`, `.connectionSet()`, `.effectiveInputPolicy()`, `.effectiveOutputPolicy()`, `.operation()`, `.[Qs]()`, `.rootElement()`, `.soapAction()`, `.soapAddress()`, `.uri()`, `.wsdlAddress()`, `.wsdlConnection()`, `.xmlConnection()`, `.xsdConnection()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (13 nodes): `sounds.ts`, `SoundManager`, `.constructor()`, `.getAudioContext()`, `.getVolume()`, `.isEnabled()`, `.loadPreferences()`, `.play()`, `.playPattern()`, `.playTone()`, `.setEnabled()`, `.setupInteractionUnlock()`, `.setVolume()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (12 nodes): `aiDataCacheService.ts`, `AIDataCacheService`, `.buildContextString()`, `.cleanup()`, `.getCachedData()`, `.invalidate()`, `.loadFreshData()`, `.notifyBackendInvalidated()`, `.notifyListeners()`, `.refreshCache()`, `.setupRealtime()`, `.subscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (11 nodes): `NullOptimizer`, `.constructor()`, `.flush()`, `._optimize()`, `.push()`, `.reset()`, `QueueOptimizer`, `.constructor()`, `.flush()`, `._optimize()`, `.reset()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (11 nodes): `billService.ts`, `BillService`, `.create()`, `.delete()`, `.getAll()`, `.getBillsNeedingReminders()`, `.getNextDueDate()`, `.getUpcoming()`, `.getUpcomingTotal()`, `.markAsPaid()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (11 nodes): `notificationSoundService.ts`, `NotificationSoundService`, `.constructor()`, `.getAudioContext()`, `.playAlert()`, `.playCash()`, `.playDing()`, `.playLevelUp()`, `.playPop()`, `.playSparkle()`, `.toggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (9 nodes): `ExpenseDetailsPage.tsx`, `ReportsPage.tsx`, `getCategoryIcon()`, `handleAddExpense()`, `handleFileImport()`, `fetchData()`, `handleExport()`, `handleGenerateReport()`, `handleImport()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (8 nodes): `XFAAttribute`, `.[As]()`, `.constructor()`, `.[ds]()`, `.[Gs]()`, `.[ns]()`, `.[Ss]()`, `.[zs]()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (8 nodes): `emailNotificationService.ts`, `EmailNotificationService`, `.clearCache()`, `.getPreferences()`, `.resetToDefaults()`, `.savePreferences()`, `.updatePreference()`, `isNotificationEnabled()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (8 nodes): `merchantCategorizationService.ts`, `MerchantCategorizationService`, `.analyzeTransactionPatterns()`, `.categorizeMerchant()`, `.getCategorySuggestions()`, `.getUserMappings()`, `.saveUserCorrection()`, `.smartCategorize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (7 nodes): `SingleIntersector`, `.addExtraChar()`, `.addGlyph()`, `.constructor()`, `.disableExtraChars()`, `.setText()`, `.#Xe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (6 nodes): `PrivacyPolicyPage.tsx`, `PrivacyPolicyPage()`, `DatasetsNamespace`, `.data()`, `.datasets()`, `.[Qs]()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (6 nodes): `Intersector`, `.addExtraChar()`, `.addGlyph()`, `.constructor()`, `.#Je()`, `.setText()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (6 nodes): `AES128Cipher`, `.constructor()`, `._expandKey()`, `AES256Cipher`, `.constructor()`, `._expandKey()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (4 nodes): `config.js`, `get()`, `loadConfigFromStorage()`, `saveConfigToStorage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (4 nodes): `get()`, `loadConfigFromStorage()`, `saveConfigToStorage()`, `config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (3 nodes): `handleDataChange()`, `loadData()`, `MoneyTwinPulse.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (3 nodes): `transactionService.ts`, `ValidationError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (3 nodes): `security.ts`, `AppError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 225`** (1 nodes): `Extract tables from PDF using pdfplumber     Best for structured bank statement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 226`** (1 nodes): `Validate that a description is meaningful, not a fragment     Rejects: ': PM',`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 227`** (1 nodes): `Enhanced transaction parsing from extracted table rows     - Properly extracts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 228`** (1 nodes): `Extract text AND tables from PDF - supports multiple pages     Returns: (text,`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 229`** (1 nodes): `Extract text from CSV file`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 230`** (1 nodes): `Use Groq AI to extract transactions from text`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 231`** (1 nodes): `Improved regex-based transaction parsing     Extracts: name, date, amount, send`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 232`** (1 nodes): `Parse a document (PDF, image, or CSV) and extract transactions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 233`** (1 nodes): `List available TTS voices`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 234`** (1 nodes): `Convert text to speech using Microsoft's FREE neural voices     Returns MP3 aud`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 235`** (1 nodes): `Stream TTS audio (for direct <audio> src)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `ConfigNamespace` connect `Community 9` to `Community 0`, `Community 1`, `Community 3`, `Community 5`, `Community 7`, `Community 23`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `TemplateNamespace` connect `Community 7` to `Community 0`, `Community 1`, `Community 3`, `Community 5`, `Community 8`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `requestPasswordReset()` connect `Community 3` to `Community 6`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `AI Document Parser Server FastAPI server for extracting text and transactions f`, `Extract tables from PDF using pdfplumber     Best for structured bank statement`, `Validate that a description is meaningful, not a fragment     Rejects: ': PM',` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
