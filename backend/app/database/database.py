"""In-memory store seeded from frontend mock data (Admin, Dash)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Store:
    accounts: list[dict[str, Any]] = field(default_factory=list)
    admin_users: list[dict[str, Any]] = field(default_factory=list)
    vendors: list[dict[str, Any]] = field(default_factory=list)
    templates: list[dict[str, Any]] = field(default_factory=list)
    events: list[dict[str, Any]] = field(default_factory=list)
    _next_account_id: int = 1
    _next_admin_user_id: int = 13
    _next_vendor_id: int = 7
    _next_event_id: int = 5


def _seed() -> Store:
    store = Store()

    store.admin_users = [
        {"id": 1, "name": "John Smith", "email": "john@gmail.com", "event": "Wedding", "status": "active"},
        {"id": 2, "name": "Sarah Wilson", "email": "sarah@gmail.com", "event": "Baby Shower", "status": "inactive"},
        {"id": 3, "name": "David Lee", "email": "david@gmail.com", "event": "Corporate Event", "status": "active"},
        {"id": 4, "name": "Emma Brown", "email": "emma@gmail.com", "event": "Graduation", "status": "inactive"},
        {"id": 5, "name": "Arjun Nair", "email": "arjun@gmail.com", "event": "Wedding", "status": "active"},
        {"id": 6, "name": "Priya Menon", "email": "priya@gmail.com", "event": "Birthday", "status": "active"},
        {"id": 7, "name": "Rahul Sharma", "email": "rahul@gmail.com", "event": "Corporate Event", "status": "inactive"},
        {"id": 8, "name": "Divya Pillai", "email": "divya@gmail.com", "event": "Baby Shower", "status": "active"},
        {"id": 9, "name": "Ananya Das", "email": "ananya@gmail.com", "event": "Graduation", "status": "active"},
        {"id": 10, "name": "Kiran Raj", "email": "kiran@gmail.com", "event": "Wedding", "status": "inactive"},
        {"id": 11, "name": "Meera Iyer", "email": "meera@gmail.com", "event": "Birthday", "status": "active"},
        {"id": 12, "name": "Suresh Kumar", "email": "suresh@gmail.com", "event": "Corporate Event", "status": "active"},
    ]

    store.vendors = [
        {"id": 1, "name": "Royal Catering", "category": "Catering", "location": "Kochi", "contact": "9876543210"},
        {"id": 2, "name": "Dream Decorations", "category": "Decoration", "location": "Thrissur", "contact": "9876501234"},
        {"id": 3, "name": "Lens Studio", "category": "Photography", "location": "Ernakulam", "contact": "9123456789"},
        {"id": 4, "name": "Star Events", "category": "Decoration", "location": "Kochi", "contact": "9988776655"},
        {"id": 5, "name": "Click Masters", "category": "Photography", "location": "Thrissur", "contact": "9011223344"},
        {"id": 6, "name": "Spice Route", "category": "Catering", "location": "Kollam", "contact": "9845123456"},
    ]

    store.templates = [
        {"title": "Wedding", "image": "https://images.unsplash.com/photo-1519741497674-611481863552", "desc": "Plan your dream wedding"},
        {"title": "House Warming", "image": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85", "desc": "Make your new house a home"},
        {"title": "Funeral", "image": "https://images.unsplash.com/photo-1516589091380-5d8e87df6999", "desc": "Respectful farewell planning"},
        {"title": "Birthday", "image": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3", "desc": "Celebrate special moments"},
        {"title": "Concert", "image": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a", "desc": "Plan a music event"},
    ]

    store.events = [
        {"id": 1, "title": "Arun & Diya Wedding", "status": "Upcoming", "progress": "60%", "image": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc"},
        {"id": 2, "title": "Our House Warming", "status": "Completed", "progress": "100%", "image": "https://images.unsplash.com/photo-1568605114967-8130f3a36994"},
        {"id": 3, "title": "Live in Kochi Concert", "status": "Planning", "progress": "30%", "image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"},
        {"id": 4, "title": "Ayesha's Birthday", "status": "Planning", "progress": "20%", "image": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d"},
    ]

    return store


db = _seed()
