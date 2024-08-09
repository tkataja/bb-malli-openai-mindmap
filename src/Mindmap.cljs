(ns Mindmap
  (:require ["react" :as react]
            ["react-d3-tree" :refer [Tree]]
            [clojure.string :as str]))

(def spinner-emojis ["🧠" "💡" "🔄"])

(defn get-path-to-root [tree-data target-node-id]
  (letfn [(traverse [node path]
            (if (= (.-name node) target-node-id)
              (conj path (.-name node))
              (some #(traverse % (conj path (.-name node)))
                    (or (.-children node) []))))]
    (traverse tree-data [])))

(defn SpinnerEmoji []
  (let [random-emoji (get spinner-emojis (js/Math.floor (* (js/Math.random) (count spinner-emojis))))]
    #jsx [:span {:className "pulsating-spinner"} random-emoji]))

(defn Mindmap []
  (let [[input setInput] (react/useState "")
        [treeData setTreeData] (react/useState nil)
        [isLoading setIsLoading] (react/useState false)
        [isGeneratingPrompt setIsGeneratingPrompt] (react/useState false)
        [treeHistory setTreeHistory] (react/useState [])
        [currentTreeIndex setCurrentTreeIndex] (react/useState -1)

        transform-data (fn transform-data [node]
                         #js {:name (.-content node)
                              :description (.-description node)
                              :children (mapv transform-data (.-children node))})

        fetch-mindmap (fn [content]
                        (setIsLoading true)
                        (-> (js/fetch "/api/mindmap"
                                      #js {:method "POST"
                                           :headers #js {"Content-Type" "application/json"}
                                           :body (js/JSON.stringify #js {:message content})})
                            (.then #(.json %))
                            (.then (fn [data]
                                     (let [new-tree-data (transform-data (.-root data))]
                                       (setTreeData new-tree-data)
                                       (setTreeHistory #(conj (subvec % 0 (inc currentTreeIndex)) new-tree-data))
                                       (setCurrentTreeIndex #(inc %)))))
                            (.catch #(js/console.error "Error fetching mindmap:" %))
                            (.finally #(setIsLoading false))))

        fetch-prompt (fn [path]
                       (setIsGeneratingPrompt true)
                       (-> (js/fetch "/api/prompt"
                                     #js {:method "POST"
                                          :headers #js {"Content-Type" "application/json"}
                                          :body (js/JSON.stringify #js {:prompt path})})
                           (.then #(.text %))
                           (.then #(.trim %))
                           (.catch (fn [error]
                                     (js/console.error "Error fetching prompt:" error)
                                     nil))
                           (.finally #(setIsGeneratingPrompt false))))

        goBack (fn []
                 (when (> currentTreeIndex 0)
                   (setCurrentTreeIndex #(dec %))
                   (let [previous-tree (get treeHistory (dec currentTreeIndex))]
                     (setTreeData previous-tree)
                     (setInput (or (.-description previous-tree) (.-name previous-tree))))))

        goForward (fn []
                    (when (< currentTreeIndex (dec (count treeHistory)))
                      (setCurrentTreeIndex #(inc %))
                      (let [next-tree (get treeHistory (inc currentTreeIndex))]
                        (setTreeData next-tree)
                        (setInput (or (.-description next-tree) (.-name next-tree))))))


        handleNodeClick (react/useCallback
                         (fn [node-data evt]
                           (when (= (.-detail evt) 2)
                             (let [path (get-path-to-root treeData (.. node-data -data -name))]
                               (when path
                                 (let [context (.join path " > ")]
                                   (-> (fetch-prompt context)
                                       (.then (fn [new-prompt]
                                                (when new-prompt
                                                  (setInput new-prompt)
                                                  (fetch-mindmap new-prompt))
                                                (when-not new-prompt
                                                  (js/console.error "Failed to fetch new prompt"))))))))
                             (.stopPropagation evt)))
                         #js [treeData])]

    #jsx [:div {:className "main-container"}
          [:div {:className "input-container"}
           [:input {:type "text"
                    :placeholder "Describe your mindmap"
                    :value input
                    :onChange #(setInput (.. % -target -value))
                    :className "input-field"
                    :disabled (or isLoading isGeneratingPrompt)}]
           [:button {:onClick #(fetch-mindmap input)
                     :disabled (or isLoading (str/blank? input))
                     :className "generate-button"}
            (if isLoading
              #jsx [:span "Generating... " [SpinnerEmoji {:key (js/Date.now)}]]
              "Generate")]]
          [:div {:className "button-container"}
           [:button {:className "navigation-button"
                     :onClick goBack
                     :disabled (<= currentTreeIndex 0)}
            "Back"]
           [:button {:className "navigation-button"
                     :onClick goForward
                     :disabled (>= currentTreeIndex (dec (count treeHistory)))}
            "Forward"]]
          (when treeData
            #jsx [Tree {:data treeData
                        :collapsible false
                        :enableLegacyTransitions true
                        :orientation "vertical"
                        :pathFunc "step"
                        :separation {:siblings 2 :nonSiblings 2}
                        :translate {:x (js/Math.floor (/ (.-innerWidth js/window) 2)) :y 50}
                        :onNodeClick handleNodeClick}])]))

