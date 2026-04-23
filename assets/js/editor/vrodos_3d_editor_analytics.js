function updatePanel(index) {
    var activePanel = panels.querySelector('.panel.active');
    if (activePanel) {
        activePanel.classList.remove('active');
    }
    var newActivePanel = panels.querySelector('.panel:nth-child(' + (index + 1) + ')');
    if (newActivePanel) {
        newActivePanel.classList.add('active');
    }
}
