import os
from bs4 import BeautifulSoup

def update_index():
    with open('ahilney/index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    grid = soup.find(class_='portal-grid')
    
    if grid and not grid.find(class_='card-center'):
        new_card = soup.new_tag('a', href='center_admin.html', **{'class': 'portal-card card-center'})
        
        icon_wrapper = soup.new_tag('div', **{'class': 'icon-wrapper'})
        icon_wrapper['style'] = 'background: rgba(245, 158, 11, 0.1); color: #f59e0b;'
        icon_wrapper.append(BeautifulSoup('<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>', 'html.parser'))
        
        h3 = soup.new_tag('h3')
        h3.string = 'Center Admin App'
        
        p = soup.new_tag('p')
        p.string = 'Manage rehab center bookings, assign internal providers, and track center capacity.'
        
        badge = soup.new_tag('span', **{'class': 'action-badge'})
        badge['style'] = 'color: #f59e0b;'
        badge.append('Open Center App ')
        badge.append(BeautifulSoup('<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>', 'html.parser'))
        
        new_card.append(icon_wrapper)
        new_card.append(h3)
        new_card.append(p)
        new_card.append(badge)
        
        # Add custom accent border via inline style since we didn't add it to CSS
        new_card['style'] = 'border-top: 4px solid #f59e0b;'
        
        grid.append(new_card)
        
        with open('ahilney/index.html', 'w', encoding='utf-8') as f:
            f.write(str(soup))
        print("Updated index.html")

update_index()
