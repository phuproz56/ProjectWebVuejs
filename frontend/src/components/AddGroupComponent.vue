<template>
	<div class="container">
		<!-- heading -->
		<div class="row">
            <div class="col-md-12">
                <h1 class="text-center text-white">Add Group</h1>
            </div>
        </div>

		<div class="row">
			<div class="offset-md-3 col-md-6">
				<!-- form to create new group -->
				<form method="POST" v-on:submit.prevent="addGroup">
					<!-- input field for name of group -->
					<div class="form-group">
						<label class="text-white">Name</label>
						<input type="text" name="name" class="form-control" required />
					</div>
					<!-- input field for selecting the picture of group (optional) -->
					<div class="form-group" style="margin-top: 20px; margin-bottom: 30px;">
						<label class="text-white">Picture</label>
						<input type="file" name="picture" accept="image/*" class="form-control" />
					</div>
					<!-- submit button -->
					<div class="d-grid gap-2">
						<input type="submit" class="btn btn-primary btn-block" v-bind:value="isLoading ? 'Creating...' : 'Create group'" v-bind:disabled="isLoading" />
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
	// axios for calling AJAX
	import axios from "axios"

	// ot show pop-up alerts
	import swal from "sweetalert2"

	export default {
		// all the variables we will be using in this component
		data() {
			return {
				"isLoading": false
			}
		},

		methods: {
			// method which called when the form submits
			addGroup: async function () {
				// get the form
				const form = event.target

				// create form data object
				const formData = new FormData(form)

				// show loading message
				this.isLoading = true

				// call an AJAX
				const response = await axios.post(
					this.$apiURL + "/groups/add",
					formData,
					{
						headers: this.$headers
					}
				)
				
				// hide the loading message
				this.isLoading = false

				// show response from server
				swal.fire("Add group", response.data.message, response.data.status)

				// reset the form if the group is successfully created
				if (response.data.status == "success") {
					form.reset()
				}
			}
		},
	}
</script>