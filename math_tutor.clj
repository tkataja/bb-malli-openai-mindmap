(ns math-tutor
  (:require [babashka.http-client :as http]
            [clojure.data.json :as json]
            [malli.core :as m]
            [malli.json-schema :as json-schema]
            [malli.util :as mu]))

(defn <-json [json-str]
  (json/read-str json-str :key-fn keyword))

(defn <-response [response]
  (update response :choices (partial mapv #(update-in % [:message :content] <-json))))

(defn json-schema-response [?schema]
  (let [schema (mu/closed-schema ?schema)]
    {:type "json_schema"
     :json_schema {:name (some-> schema (m/properties) :name (or "response"))
                   :schema (json-schema/transform schema)
                   :strict true}}))

(defn completion [data]
  (let [response (http/post "https://api.openai.com/v1/chat/completions"
                            {:headers {"Content-Type" "application/json"
                                       "Authorization" (str "Bearer " (System/getenv "OPENAI_API_KEY"))}
                             :body (json/write-str data)})]
    (-> response
        :body
        (<-json)
        (<-response))))

(def Step
  [:map
   [:explanation :string]
   [:output :string]])

(def MathResponse
  [:map {:name "mathresponse"}
   [:steps [:vector Step]]
   [:final_answer :string]])

(defn get-math-response []
  (completion
   {:model "gpt-4o-2024-08-06",
    :messages [{:role "system",
                :content "You are a helpful math tutor. Only use the schema for math responses."},
               {:role "user"
                :content "how can I solve 8x + 7 = -23"}]
    :response_format (json-schema-response MathResponse)}))

(clojure.pprint/pprint (get-math-response))
