
import { useEffect, useState } from 'react'
import './App.css'



const categories = [
  { name: 'Development', icon: '💻', count: '120+' },
  { name: 'Design', icon: '🎨', count: '85+' },
  { name: 'Data', icon: '📊', count: '60+' },
  { name: 'Marketing', icon: '📢', count: '45+' },
]


function AdminDashboard({ applications, totalApplications, onBack }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>JobBoard<span>Pro</span></h2>
        <p className="admin-label">ADMIN PANEL</p>

        <button className="admin-nav active">
          Applications
        </button>

        <button className="admin-back" onClick={onBack}>
          ← Back to website
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <span>Admin / Applications</span>
          <span className="admin-profile">Admin</span>
        </div>

        <div className="admin-heading">
          <div>
            <p>OVERVIEW</p>
            <h1>Applications</h1>
            <span>Manage submitted job applications.</span>
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Applications</span>
            <h2>{totalApplications}</h2>
          </div>

          <div className="admin-stat-card">
            <span>Pending Applications</span>
            <h2>
              {applications.filter(
                (app) => app.status === 'Pending'
              ).length}
            </h2>
          </div>
        </div>

        <div className="admin-table-container">
          <h3>Recent Applications</h3>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Job ID</th>
                <th>Status</th>
                <th>Cover Letter</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((app, index) => (
                <tr key={app._id?.$oid || index}>
                  <td>Application #{index + 1}</td>
                  <td>{app.jobId?.$oid || String(app.jobId || '')}</td>
                  <td>
                    <span className="pending-status">
                      {app.status}
                    </span>
                  </td>
                  <td>{app.coverLetter}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {applications.length === 0 && (
            <p className="admin-empty">
              No applications received yet.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}


function App() {
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const [jobs, setJobs] = useState([])
  const [companies, setCompanies] = useState([])
  const [applications, setApplications] = useState([])
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [totalApplications, setTotalApplications] = useState(0)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [activeDetailsTab, setActiveDetailsTab] = useState('Overview')
  const [showApplication, setShowApplication] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [applicantName, setApplicantName] = useState('')
  const [applicantEmail, setApplicantEmail] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [applicationMessage, setApplicationMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleApplicationSubmit = async (e) => {
  e.preventDefault()
  setSubmitting(true)
  setApplicationMessage('')

  try {
    const response = await fetch('http://127.0.0.1:8000/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId: selectedJob._id.$oid,
        name: applicantName,
        email: applicantEmail,
        coverLetter: coverLetter,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Application failed.')
    }

    setApplicationMessage('Application submitted successfully!')
    setApplicantName('')
    setApplicantEmail('')
    setCoverLetter('')
  } catch (error) {
    setApplicationMessage(error.message)
  } finally {
    setSubmitting(false)
  }
}

useEffect(() => {
  console.log('JobBoardPro is fetching jobs')


  const skip = (currentPage - 1) * 10

fetch(`http://127.0.0.1:8000/api/jobs?skip=${skip}&limit=10`)
  .then((response) => response.json())
  .then((data) => {
    

    setJobs(data.jobs)
    setTotalJobs(data.total_jobs)
  })
  .catch((error) => console.error('Error fetching jobs:', error))

      fetch('http://127.0.0.1:8000/api/companies')
    .then((response) => response.json())
    .then((data) => setCompanies(data.companies))
    .catch((error) => console.error('Error fetching companies:', error))

    
}, [currentPage])

const totalPages = Math.ceil(totalJobs / 10)

  const filteredJobs = jobs.filter((job) => {
  const matchesSearch =
    (job.title || '').toLowerCase().includes(search.toLowerCase())

  const matchesLocation =
    (job.location || '').toLowerCase().includes(location.toLowerCase())

  const title = (job.title || '').toLowerCase()

const matchesCategory =
  activeCategory === 'All' ||
  (activeCategory === 'Development' &&
    /(developer|engineer|software|devops)/.test(title)) ||
  (activeCategory === 'Design' &&
    /(designer|design|ui\/ux|ux|graphic)/.test(title)) ||
  (activeCategory === 'Data' &&
    /(data|analyst|scientist|machine learning)/.test(title))

  return matchesSearch && matchesLocation && matchesCategory
})

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-icon">J</span>
          JobBoard<span>Pro</span>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#jobs">Find Jobs</a>
          <a href="#categories">Categories</a>
        </nav>

        <div className="nav-actions">
  <button
  className="login-btn"
  onClick={() => {
  const password = prompt('Enter admin password:')

  if (!password) return

  fetch('http://127.0.0.1:8000/api/applications?skip=0&limit=10', {
    headers: {
      'x-admin-secret': password
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Incorrect admin password')
      }
      return response.json()
    })
    .then((data) => {
      setApplications(data.applications)
      setTotalApplications(data.total_applications)
      setAdminPassword(password)
      setShowAdminPanel(true)
    })
    .catch(() => alert('Incorrect admin password'))
}}
>
  Admin
</button>
  <button className="signup-btn">Sign up</button>
</div>

        
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="announcement">
              <span>✦</span> Find your next opportunity
            </div>

            <h1>
              Find a job that
              <br />
              <span>moves you forward.</span>
            </h1>

            <p>
              Discover opportunities, explore companies, and take
              the next step in your career with JobBoardPro.
            </p>

            <div className="search-box">
              <div className="search-field">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Job title or company"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="search-divider"></div>

              <div className="search-field">
                <span>⌖</span>
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <button
                className="search-btn"
                onClick={() =>
                  document.getElementById('jobs').scrollIntoView({
                    behavior: 'smooth',
                  })
                }
              >
                Search jobs
              </button>
            </div>

            <div className="hero-note">
              Popular: <span>Developer</span> · <span>Designer</span> ·
              <span> Data Analyst</span>
            </div>
          </div>

          <div className="hero-decoration">
            <div className="decoration-circle circle-one"></div>
            <div className="decoration-circle circle-two"></div>
            <div className="floating-card">
              <span className="floating-icon">✦</span>
              <div>
                <strong>Your next chapter</strong>
                <small>Starts with one opportunity.</small>
              </div>
            </div>
          </div>
        </section>

        <section className="stats">
          <div>
            <strong>1,000+</strong>
            <span>Job listings</span>
          </div>
          <div>
            <strong>500+</strong>
            <span>Companies</span>
          </div>
          <div>
            <strong>50+</strong>
            <span>Career fields</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Explore opportunities</span>
          </div>
        </section>

        <section className="categories-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORE BY INTEREST</span>
              <h2>Popular categories</h2>
              <p>Find opportunities in the fields you love.</p>
            </div>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <button
                className={`category-card ${
                  activeCategory === category.name ? 'selected' : ''
                }`}
                key={category.name}
                onClick={() =>
                  setActiveCategory(
                    activeCategory === category.name ? 'All' : category.name
                  )
                }
              >
                <span className="category-icon">{category.icon}</span>
                <strong>{category.name}</strong>
                <small>{category.count} opportunities</small>
              </button>
            ))}
          </div>
        </section>

        <section className="jobs-section" id="jobs">
          <div className="section-heading jobs-heading">
            <div>
              <span className="eyebrow">YOUR NEXT OPPORTUNITY</span>
              <h2>Featured jobs</h2>
              <p>Explore some of the opportunities available.</p>
            </div>

            <button
              className="clear-filter"
              onClick={() => {
                setActiveCategory('All')
                setSearch('')
                setLocation('')
              }}
            >
              Clear filters
            </button>
          </div>

          <div className="filter-tabs">
            {['All', 'Development', 'Design', 'Data'].map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="job-grid">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                
<article className="job-card" key={job._id.$oid}>

  {/* Card Header */}
  <div className="job-card-header">
    <div className="job-card-title">
      <div className="company-logo">
        {(job.title || 'J').charAt(0).toUpperCase()}
      </div>

      <div>
        <h3>{job.title}</h3>
        <p className="company-name">
          {companies.find(
            (company) => company._id.$oid === job.companyId.$oid
          )?.name || 'Company'}
        </p>
      </div>
    </div>

    <span className="job-type">
      {job.jobType || 'Not specified'}
    </span>
  </div>

  {/* Location and Experience */}
  <div className="job-meta">
    <span>⌖ {job.location || 'Location not specified'}</span>
    <span>◷ {job.experienceLevel || 'Not specified'}</span>
  </div>


  {/* Salary */}
  <div className="job-salary">
    <p className="section-label">SALARY</p>

    <strong>
      {job.salary && typeof job.salary === 'object'
        ? `${job.salary.currency || ''} ${job.salary.min ?? ''} - ${job.salary.max ?? ''}`
        : job.salary || 'Salary not specified'}
    </strong>
    <span>Per month</span>
  </div>

  {/* Actions */}
  <div className="job-card-footer">
    <button
      className="details-btn"
      onClick={() => {
        setSelectedJob(job)
        setShowApplication(false)
        setShowJobDetails(true)
      }}
    >
      View Details ↗
    </button>

    <button
      className="apply-text-btn"
      onClick={() => {
        setSelectedJob(job)
        setShowJobDetails(false)
        setShowApplication(true)
      }}
    >
      Apply Now ↗
    </button>
  </div>

</article>

              ))
            ) : (
              <p className="no-jobs">
                No matching jobs found. Try another search.
              </p>
                        )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}

        </section>

                

        <section className="bottom-banner">
          <div>
            <span className="eyebrow">READY FOR YOUR NEXT STEP?</span>
            <h2>Your next opportunity is out there.</h2>
            <p>Start exploring and find a role that fits your goals.</p>
          </div>
          <a href="#jobs">Explore jobs ↗</a>
        </section>
      </main>
      {selectedJob && showApplication && (
  <div className="application-overlay">
    <div className="application-form">
      <button
        type="button"
        className="close-form"
        onClick={() => {
  setShowApplication(false)
  setSelectedJob(null)
}}
      >
        ×
      </button>

      <h2>Apply for {selectedJob.title}</h2>
      <p>Fill in your details to apply for this job.</p>

      <form onSubmit={handleApplicationSubmit}>
  <input
    type="text"
    placeholder="Your full name"
    value={applicantName}
    onChange={(e) => setApplicantName(e.target.value)}
    required
  />

  <input
    type="email"
    placeholder="Your email address"
    value={applicantEmail}
    onChange={(e) => setApplicantEmail(e.target.value)}
    required
  />

  <textarea
    placeholder="Why are you interested in this job?"
    value={coverLetter}
    onChange={(e) => setCoverLetter(e.target.value)}
    required
  />

  <button type="submit" className="apply-btn" disabled={submitting}>
    {submitting ? 'Submitting...' : 'Submit Application'}
  </button>

  {applicationMessage && (
    <p>{applicationMessage}</p>
  )}
</form>
    </div>
  </div>
)}


{selectedJob && showJobDetails && (
  <div className="application-overlay">
    <div className="application-form details-modal">

      <button
        type="button"
        className="close-form"
        onClick={() => {
          setShowJobDetails(false)
          setSelectedJob(null)
          setActiveDetailsTab('Overview')
        }}
      >
        ×
      </button>

      <span className="eyebrow">JOB DETAILS</span>

      <h2>{selectedJob.title}</h2>

      <p className="details-company">
        {companies.find(
          (company) => company._id.$oid === selectedJob.companyId.$oid
        )?.name || 'Company not specified'}
        {' · '}
        {selectedJob.location || 'Location not specified'}
      </p>

      <div className="details-info">
        <div>
          <span>Salary</span>
          <strong>
            {selectedJob.salary && typeof selectedJob.salary === 'object'
              ? `${selectedJob.salary.currency || ''} ${selectedJob.salary.min ?? ''} - ${selectedJob.salary.max ?? ''}`
              : selectedJob.salary || 'Not specified'}
          </strong>
        </div>

        <div>
          <span>Experience</span>
          <strong>{selectedJob.experienceLevel || 'Not specified'}</strong>
        </div>

        <div>
          <span>Job Type</span>
          <strong>{selectedJob.jobType || 'Not specified'}</strong>
        </div>
      </div>

      <div className="details-tabs">
        {['Overview', 'Skills', 'Requirements'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeDetailsTab === tab ? 'active' : ''}
            onClick={() => setActiveDetailsTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="details-content">
        {activeDetailsTab === 'Overview' && (
          <>
            <h3>About this role</h3>
            <p>
              {selectedJob.description || 'No description available.'}
            </p>
          </>
        )}

        {activeDetailsTab === 'Skills' && (
          <>
            <h3>Required Skills</h3>
            <div className="details-skills">
              {selectedJob.requiredSkills?.length > 0
                ? selectedJob.requiredSkills.map((skill, index) => (
                    <span key={index}>{skill.name}</span>
                  ))
                : 'No skills specified.'}
            </div>
          </>
        )}

        {activeDetailsTab === 'Requirements' && (
          <>
            <h3>What we're looking for</h3>
            <p>
              Experience level: {selectedJob.experienceLevel || 'Not specified'}
            </p>
            <p>
              Job type: {selectedJob.jobType || 'Not specified'}
            </p>
            <p>
              Location: {selectedJob.location || 'Not specified'}
            </p>
          </>
        )}
      </div>

      <button
        className="apply-btn"
        onClick={() => {
          setShowJobDetails(false)
          setShowApplication(true)
        }}
      >
        Apply Now
      </button>

    </div>
  </div>
)}


      <footer className="footer">
        <a className="brand" href="#home">
          <span className="brand-icon">J</span>
          JobBoard<span>Pro</span>
        </a>
        <p>Connecting people with opportunities.</p>
        <span>© 2026 JobBoardPro</span>
      </footer>
            {showAdminPanel && (
        <div
          className="admin-overlay"
          onClick={() => setShowAdminPanel(false)}
        >
          <aside
            className="admin-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-drawer-header">
              <div>
                <span className="eyebrow">JOBBOARDPRO</span>
                <h2>Applications</h2>
              </div>

              <button
                className="admin-close"
                onClick={() => setShowAdminPanel(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-summary">
              <div>
                <span>Total Applications</span>
                <strong>{totalApplications}</strong>
              </div>

              <div>
                <span>Pending</span>
                <strong>
                  {applications.filter(
                    (app) => app.status === 'Pending'
                  ).length}
                </strong>
              </div>
            </div>

            <div className="admin-applications-list">
              {applications.length > 0 ? (
                applications.map((app, index) => (
                  <div
                    className="admin-application-row"
                    key={app._id?.$oid || index}
                  >
                    <div>
                      <strong>Application #{index + 1}</strong>
                      <small>
                        {app.jobTitle || 'Job details unavailable'}
                      </small>
                    </div>

                    <span className="pending-status">
                      {app.status}
                    </span>
                  </div>
                ))
              ) : (
                <p>No applications yet.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default App
