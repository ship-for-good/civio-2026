#!/usr/bin/env python3
"""
Script to scrape the transparency.gob.es website and extract relevant information.
"""

import requests
from bs4 import BeautifulSoup
import json
from urllib.parse import urljoin

# Base URL of the transparency portal
BASE_URL = "https://transparencia.gob.es"

# Function to fetch a URL and return the HTML content
def fetch_url(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

# Function to scrape the main page and extract links
def scrape_main_page():
    html = fetch_url(BASE_URL)
    if not html:
        return []
    
    soup = BeautifulSoup(html, 'html.parser')
    links = []
    
    # Extract all links from the main page
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith('/'):
            full_url = urljoin(BASE_URL, href)
            links.append(full_url)
    
    return links

# Function to scrape a specific page and extract content
def scrape_page(url):
    html = fetch_url(url)
    if not html:
        return None
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extract the main content
    content = {
        'url': url,
        'title': soup.title.string if soup.title else 'No title',
        'headings': [],
        'paragraphs': [],
        'links': [],
        'tables': []
    }
    
    # Extract headings
    for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        content['headings'].append({
            'tag': heading.name,
            'text': heading.get_text(strip=True)
        })
    
    # Extract paragraphs
    for p in soup.find_all('p'):
        text = p.get_text(strip=True)
        if text:
            content['paragraphs'].append(text)
    
    # Extract links
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith('/') or href.startswith('https://transparencia.gob.es'):
            full_url = urljoin(BASE_URL, href) if href.startswith('/') else href
            content['links'].append({
                'text': a.get_text(strip=True),
                'url': full_url
            })
    
    # Extract tables (for salary data)
    for table in soup.find_all('table'):
        rows = []
        for row in table.find_all('tr'):
            cells = [cell.get_text(strip=True) for cell in row.find_all(['th', 'td'])]
            if cells:
                rows.append(cells)
        if rows:
            content['tables'].append(rows)
    
    return content

# Function to save scraped data to a JSON file
def save_scraped_data(data, filename='scraped_data.json'):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Scraped data saved to {filename}")

# Main function to scrape the transparency portal
def main():
    print("Starting to scrape transparency.gob.es...")
    
    # Specific links to scrape for better results
    specific_links = [
        "https://transparencia.gob.es/publicidad-activa/por-materias",
        "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo",
        "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/funciones",
        "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/estructura",
        "https://transparencia.gob.es/publicidad-activa/por-materias/altos-cargos"
    ]
    
    # Scrape specific links
    scraped_data = []
    for i, link in enumerate(specific_links):
        print(f"Scraping {link}...")
        content = scrape_page(link)
        if content:
            scraped_data.append(content)
    
    # Save the scraped data
    save_scraped_data(scraped_data)
    
    print("Scraping completed!")

if __name__ == "__main__":
    main()
