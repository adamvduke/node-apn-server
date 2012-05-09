function(doc) {
    if (doc.applications != null && doc.applications.length > 0)
    {
        doc.applications.forEach(function(application) {
            emit(application.app_id, application.app_secret);
        });
    }
}