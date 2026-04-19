#include "crow.h"
#include <queue>
#include <vector>
#include <string>
#include <iostream>

/**
 * Task Structure
 */
struct Task {
    int id;
    std::string name;
    int priority;

    /**
     * Operator overloading for Priority Queue (Max Heap)
     * A greater priority value results in a "smaller" position in the underlying heap logic,
     * meaning it bubbles to the top (max-heap behavior).
     */
    bool operator<(const Task& other) const {
        return priority < other.priority;
    }
};

int main() {
    crow::SimpleApp app;
    
    // Memory storage for tasks using a max heap
    std::priority_queue<Task> pq;
    int idCounter = 1;

    // POST /add -> Add a new task
    CROW_ROUTE(app, "/add").methods("POST"_method)([&](const crow::request& req){
        auto body = crow::json::load(req.body);
        if (!body || !body.has("name") || !body.has("priority")) {
            return crow::response(400, "Invalid JSON payload");
        }

        Task newTask = {
            idCounter++,
            body["name"].s(),
            (int)body["priority"].i()
        };

        pq.push(newTask);
        
        crow::json::wvalue res;
        res["message"] = "Task added successfully";
        res["task"]["id"] = newTask.id;
        return crow::response(200, res);
    });

    // POST /execute -> Remove and return highest priority task
    CROW_ROUTE(app, "/execute").methods("POST"_method)([&](){
        if (pq.empty()) {
            return crow::response(404, "No tasks available to execute");
        }

        Task highestPriorityTask = pq.top();
        pq.pop();

        crow::json::wvalue res;
        res["id"] = highestPriorityTask.id;
        res["name"] = highestPriorityTask.name;
        res["priority"] = highestPriorityTask.priority;
        res["message"] = "Task executed";

        return crow::response(200, res);
    });

    // GET /tasks -> Return all tasks in priority order
    CROW_ROUTE(app, "/tasks")([&](){
        // Copy priority queue to preserve original data
        std::priority_queue<Task> tempQueue = pq;
        std::vector<crow::json::wvalue> taskList;

        while (!tempQueue.empty()) {
            Task t = tempQueue.top();
            tempQueue.pop();

            crow::json::wvalue taskJson;
            taskJson["id"] = t.id;
            taskJson["name"] = t.name;
            taskJson["priority"] = t.priority;
            taskList.push_back(std::move(taskJson));
        }

        return crow::response(crow::json::wvalue(taskList));
    });

    std::cout << "C++ Crow Server started on port 3000..." << std::endl;
    app.port(3000).multithreaded().run();
}
