(ns server
  (:require [babashka.http-client :as http]
            [clojure.data.json :as json]
            [malli.core :as m]
            [malli.json-schema :as json-schema]
            [malli.util :as mu]
            [org.httpkit.server :as server]
            [ruuter.core :as ruuter]))

;;
;; Malli schemas
;;

(def MindmapNode
  [:map {:name "MindmapNode" :closed true}
   [:id :string]
   [:content :string]
   [:children [:vector [:ref "MindmapNode"]]]])

(def Mindmap
  [:map {:name "Mindmap"}
   [:title :string]
   [:root MindmapNode]])

(def registry (merge (m/default-schemas) (mu/schemas) {"MindmapNode" MindmapNode}))

;;
;; OpenAI API
;;
(defn <-json [json-str]
  (json/read-str json-str :key-fn keyword))

(defn <-response [response]
  (update response :choices (partial mapv #(update-in % [:message :content] <-json))))

(defn json-schema-response [?schema]
  (let [schema (mu/closed-schema ?schema {:registry registry})]
    {:type "json_schema"
     :json_schema {:name (some-> schema (m/properties) :name (or "response"))
                   :schema (json-schema/transform schema)
                   :strict true}}))

(defn completion [data]
  (let [response
        (http/post "https://api.openai.com/v1/chat/completions"
                   {:headers {"Content-Type" "application/json"
                              "Authorization" (str "Bearer " (System/getenv "OPENAI_API_KEY"))}
                    :body (json/write-str data)
                    :timeout 60000
                    :throw false})]
    (-> response
        :body
        (<-json))))

(defn completion-json [body]
  (-> (completion body)
      (<-response)))

;;
;; Mindmapping http api
;;

(defn create-mindmap [msg]
  (completion-json
   {:model "gpt-4o-2024-08-06",
    :temperature 1.0
    :max_tokens 2048
    :stream false
    :messages [{:role "system",
                :content "You are a helpful brainstorming assistant who creates mind maps. Keep descriptions short and concise."},
               {:role "user"
                :content msg}]
    :response_format (json-schema-response Mindmap)}))

(defn create-prompt [msg]
  (completion
   {:model "gpt-4o",
    :temperature 1.0
    :max_tokens 128
    :stream false
    :messages [{:role "system",
                :content "You receive a mindmap path. Return a concise mindmap title for further subtopic exploration."},
               {:role "user"
                :content msg}]}))

(defn mindmap-handler [req]
  (let [body (slurp (:body req))
        msg (get (json/read-str body :key-fn keyword) :message)
        mindmap-response (create-mindmap msg)]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (json/write-str (-> mindmap-response :choices first :message :content))}))

(defn prompt-handler [req]
  (let [body (slurp (:body req))
        prompt (get (json/read-str body :key-fn keyword) :prompt)
        prompt-response (create-prompt prompt)]
    {:status 200
     :headers {"Content-Type" "text/plain"}
     :body (-> prompt-response :choices first :message :content)}))


(def routes
  [{:path "/api/mindmap"
    :method :post
    :response mindmap-handler}
   {:path "/api/prompt"
    :method :post
    :response prompt-handler}])

(defn start-server []
  (let [server-instance (server/run-server #(ruuter/route routes %) {:ip "127.0.0.1" :port 8080})]
    ;; Add a shutdown hook to gracefully stop the server
    (.addShutdownHook (Runtime/getRuntime)
                      (Thread. (fn []
                                 (println "Shutting down server...")
                                 (server-instance))))
    (println "Server is running. Press Ctrl+C to stop.")
    (Thread/sleep Long/MAX_VALUE)))

(start-server)
