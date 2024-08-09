(ns index
  (:require ["react-dom/client" :as rdom]
            [Mindmap :as Mindmap]))

(def root (rdom/createRoot (js/document.getElementById "app")))
(.render root #jsx [Mindmap/Mindmap])
